import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { LogDeliveryDto } from './dto/log-delivery.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { WhatsAppService } from '../notifications/whatsapp.service';

@Injectable()
export class ShiftService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  /**
   * Driver opens a new shift session
   */
  async openShift(dto: OpenShiftDto) {
    // 1. Verify Driver exists and has role DRIVER
    const driver = await this.prisma.user.findUnique({
      where: { id: dto.driverId },
    });
    if (!driver || driver.role !== 'DRIVER') {
      throw new BadRequestException(`User with ID ${dto.driverId} does not exist or is not a DRIVER.`);
    }

    // 2. Check for active or un-reconciled shifts
    const activeOrUnreconciledShift = await this.prisma.driverShift.findFirst({
      where: {
        driverId: dto.driverId,
        status: {
          not: 'RECONCILED',
        },
      },
    });

    if (activeOrUnreconciledShift) {
      throw new BadRequestException(
        `Driver already has an open or un-reconciled dispatch session (Dispatch ID: ${activeOrUnreconciledShift.id}, Status: ${activeOrUnreconciledShift.status}). Complete it before opening a new one.`
      );
    }

    // 3. Verify warehouse stock and existance
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${dto.warehouseId} not found.`);
    }

    if (warehouse.tenantId !== dto.tenantId) {
      throw new BadRequestException(`Warehouse does not belong to tenant ${dto.tenantId}`);
    }

    // Fetch and validate assigned orders
    const orderIds = dto.orderIds || [];
    let assignedQuantity = 0;
    let ordersToAssign = [];

    if (orderIds.length > 0) {
      ordersToAssign = await this.prisma.order.findMany({
        where: {
          id: { in: orderIds },
        },
        include: {
          customer: true,
        },
      });

      if (ordersToAssign.length !== orderIds.length) {
        throw new NotFoundException('Some assigned orders were not found.');
      }

      for (const order of ordersToAssign) {
        if (order.tenantId !== dto.tenantId) {
          throw new BadRequestException(`Order ${order.id} does not belong to tenant ${dto.tenantId}`);
        }
        if (order.status !== 'DRAFT' && order.status !== 'BLOCKED') {
          throw new BadRequestException(`Order ${order.id} is in status ${order.status} and cannot be assigned. Only DRAFT or BLOCKED orders can be assigned.`);
        }
        if (order.customer?.status === 'BLOCKED') {
          throw new BadRequestException(`Cannot assign order ${order.id}. Customer ${order.customer.name} is BLOCKED.`);
        }
        assignedQuantity += order.quantity;
      }
    }

    const alreadyDeductedQuantity = ordersToAssign
      .filter(o => o.status !== 'BLOCKED')
      .reduce((sum, o) => sum + o.quantity, 0);

    const extra = dto.startFullCylinders - alreadyDeductedQuantity;
    if (dto.startFullCylinders < assignedQuantity) {
      throw new BadRequestException(
        `Loaded full cylinders (${dto.startFullCylinders}) is less than total assigned orders quantity (${assignedQuantity}).`
      );
    }

    if (warehouse.fullCylinderStock < extra) {
      throw new BadRequestException(
        `Warehouse does not have enough full cylinders for the extra load. Available: ${warehouse.fullCylinderStock}, Required extra: ${extra}`
      );
    }

    const startEmpties = dto.startEmptyCylinders ?? 0;
    if (warehouse.emptyCylinderStock < startEmpties) {
      throw new BadRequestException(
        `Warehouse does not have enough empty cylinders. Available: ${warehouse.emptyCylinderStock}, Requested: ${startEmpties}`
      );
    }

    // 4. Create Shift and adjust warehouse inventory in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Re-verify stock inside transaction
      const currentWarehouse = await tx.warehouse.findUnique({
        where: { id: dto.warehouseId },
      });
      if (!currentWarehouse) {
        throw new NotFoundException(`Warehouse with ID ${dto.warehouseId} not found.`);
      }
      if (currentWarehouse.fullCylinderStock < extra) {
        throw new BadRequestException(
          `Warehouse does not have enough full cylinders for the extra load. Available: ${currentWarehouse.fullCylinderStock}, Required extra: ${extra}`
        );
      }
      if (currentWarehouse.emptyCylinderStock < startEmpties) {
        throw new BadRequestException(
          `Warehouse does not have enough empty cylinders. Available: ${currentWarehouse.emptyCylinderStock}, Requested: ${startEmpties}`
        );
      }

      // Decrement warehouse stock (only by extra full cylinders, and startEmpties)
      await tx.warehouse.update({
        where: { id: dto.warehouseId },
        data: {
          fullCylinderStock: {
            decrement: extra,
          },
          emptyCylinderStock: {
            decrement: startEmpties,
          },
        },
      });

      // Create driver shift session
      const shift = await tx.driverShift.create({
        data: {
          tenantId: dto.tenantId,
          driverId: dto.driverId,
          truckId: dto.truckId,
          startFullCylinders: dto.startFullCylinders,
          startEmptyCylinders: startEmpties,
          expectedCash: dto.startCash ?? 0.0,
          status: 'ACTIVE',
        },
      });

      // If orders assigned, update their driver, shiftSessionId, and transition status to ASSIGNED
      if (orderIds.length > 0) {
        for (const order of ordersToAssign) {
          await tx.order.update({
            where: { id: order.id },
            data: {
              driverId: dto.driverId,
              shiftSessionId: shift.id,
              status: 'ASSIGNED',
            },
          });

          if (order.status === 'BLOCKED') {
            // Create CylinderLedger entry for the previously blocked order
            await tx.cylinderLedger.create({
              data: {
                tenantId: dto.tenantId,
                warehouseId: dto.warehouseId,
                customerId: order.customerId,
                orderId: order.id,
                driverId: dto.driverId,
                shiftSessionId: shift.id,
                fullDelta: -order.quantity,
                transactionType: 'ORDER_STOCK_DEBIT',
                notes: `Stock debit for unblocked order ${order.id} upon assignment in shift opening`,
              },
            });
          } else {
            // Update the CylinderLedger records created during order creation to link them to the driver and shift session
            await tx.cylinderLedger.updateMany({
              where: {
                orderId: order.id,
                transactionType: 'ORDER_STOCK_DEBIT',
              },
              data: {
                driverId: dto.driverId,
                shiftSessionId: shift.id,
              },
            });
          }
        }
      }

      // Log the loading to the truck
      await tx.cylinderLedger.create({
        data: {
          tenantId: dto.tenantId,
          warehouseId: dto.warehouseId,
          driverId: dto.driverId,
          shiftSessionId: shift.id,
          fullDelta: -extra,
          emptyDelta: -startEmpties,
          transactionType: 'LOADING_TO_TRUCK',
          notes: `Loaded truck ${dto.truckId} from warehouse ${currentWarehouse.name} for dispatch session (extra full: ${extra}, empty: ${startEmpties}).`,
        },
      });

      return shift;
    });
  }

  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  }

  /**
   * Driver logs a delivery of full cylinders and recovery of empty cylinders
   */
  async logDelivery(dto: LogDeliveryDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${dto.orderId} not found.`);
    }

    if (order.status !== 'IN_TRANSIT' && order.status !== 'ASSIGNED') {
      throw new BadRequestException(
        `Delivery cannot be logged. Order status must be IN_TRANSIT or ASSIGNED. Current: ${order.status}`
      );
    }

    if (!order.shiftSessionId) {
      throw new BadRequestException(`Order ${dto.orderId} is not associated with any dispatch session.`);
    }

    const shift = await this.prisma.driverShift.findUnique({
      where: { id: order.shiftSessionId },
    });

    if (!shift || shift.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Associated dispatch session ${order.shiftSessionId} is not ACTIVE (Current status: ${shift?.status}).`
      );
    }

    const liabilityIncrement = order.quantity - dto.recoveredQuantity;

    const customer = await this.prisma.customer.findUnique({
      where: { id: order.customerId },
    });

    let geofenceDistance: number | null = null;
    let geofenceViolated = false;

    if (
      customer &&
      customer.latitude !== null &&
      customer.longitude !== null &&
      dto.deliveryLatitude !== undefined &&
      dto.deliveryLatitude !== null &&
      dto.deliveryLongitude !== undefined &&
      dto.deliveryLongitude !== null
    ) {
      geofenceDistance = this.calculateHaversineDistance(
        customer.latitude,
        customer.longitude,
        dto.deliveryLatitude,
        dto.deliveryLongitude
      );
      if (geofenceDistance > 100) {
        geofenceViolated = true;
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update Order status and details
      const finalPhoto = dto.receiptUrl || dto.deliveryPhoto || null;
      const finalPaymentTerms = dto.paymentTerms || order.paymentTerms;
      const finalNotes = dto.chequeNumber
        ? `${dto.notes || ''} [Cheque No: ${dto.chequeNumber}]`.trim()
        : (dto.notes ?? null);

      const updatedOrder = await tx.order.update({
        where: { id: dto.orderId },
        data: {
          status: 'DELIVERED_UNVERIFIED',
          deliveredAt: new Date(),
          customerSignature: dto.customerSignature ?? null,
          deliveryPhoto: finalPhoto,
          indirectHandover: dto.indirectHandover ?? false,
          notes: finalNotes,
          deliveryLatitude: dto.deliveryLatitude ?? null,
          deliveryLongitude: dto.deliveryLongitude ?? null,
          paymentTerms: finalPaymentTerms,
          geofenceDistance,
          geofenceViolated,
        },
      });

      // 2. Increment Customer Cylinder Liability
      await tx.customer.update({
        where: { id: order.customerId },
        data: {
          emptyCylinderLiability: {
            increment: liabilityIncrement,
          },
        },
      });

      // 3. Update CylinderLedger for full delivery
      await tx.cylinderLedger.create({
        data: {
          tenantId: order.tenantId,
          customerId: order.customerId,
          driverId: order.driverId,
          shiftSessionId: order.shiftSessionId,
          orderId: order.id,
          fullDelta: -order.quantity,
          transactionType: 'DELIVERY_TO_CUSTOMER',
          notes: `Delivered ${order.quantity} full cylinders to customer.`,
        },
      });

      // 4. Update CylinderLedger for empty recovery
      await tx.cylinderLedger.create({
        data: {
          tenantId: order.tenantId,
          customerId: order.customerId,
          driverId: order.driverId,
          shiftSessionId: order.shiftSessionId,
          orderId: order.id,
          emptyDelta: dto.recoveredQuantity,
          transactionType: 'EMPTY_RECOVERY_FROM_CUSTOMER',
          notes: `Recovered ${dto.recoveredQuantity} empty cylinders from customer.`,
        },
      });

      // 5. Update shift expectedCash if terms are CASH_ON_DELIVERY or CHEQUE_ON_DELIVERY
      if (finalPaymentTerms === 'CASH_ON_DELIVERY' || finalPaymentTerms === 'CHEQUE_ON_DELIVERY') {
        const cashIncrement = dto.collectedAmount !== undefined ? dto.collectedAmount : order.totalAmount;
        await tx.driverShift.update({
          where: { id: order.shiftSessionId! },
          data: {
            expectedCash: {
              increment: cashIncrement,
            },
          },
        });
      }

      return updatedOrder;
    });

    if (customer) {
      await this.whatsapp.sendOrderDelivery(
        customer.phoneNumber || 'unknown',
        customer.name,
        order.id,
        order.quantity,
        geofenceViolated,
      ).catch((err) => console.error('Failed to send WhatsApp delivery alert:', err));
    }

    return result;
  }

  /**
   * Accountant reconciles and closes driver shift session
   */
  async closeShift(shiftSessionId: string, dto: CloseShiftDto) {
    const shift = await this.prisma.driverShift.findUnique({
      where: { id: shiftSessionId },
      include: {
        driver: true,
      },
    });

    if (!shift) {
      throw new NotFoundException(`Dispatch session with ID ${shiftSessionId} not found.`);
    }

    if (shift.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Dispatch session is not in ACTIVE status. Current status: ${shift.status}`
      );
    }

    // 1. Verify all assigned orders are delivered or cancelled
    const activeOrders = await this.prisma.order.findMany({
      where: {
        shiftSessionId: shiftSessionId,
        status: {
          in: ['DRAFT', 'ASSIGNED', 'IN_TRANSIT'],
        },
      },
    });

    if (activeOrders.length > 0) {
      throw new BadRequestException(
        `Cannot complete driver settlement. There are still ${activeOrders.length} customer deliveries in progress/un-delivered.`
      );
    }

    // 2. Fetch CylinderLedger records to calculate expected empties
    const ledgers = await this.prisma.cylinderLedger.findMany({
      where: { shiftSessionId },
    });

    const sumRecovered = ledgers
      .filter((l) => l.transactionType === 'EMPTY_RECOVERY_FROM_CUSTOMER')
      .reduce((sum, l) => sum + l.emptyDelta, 0);

    // Empties swapped: min(delivered fulls, recovered empties) per order
    const orderIds = Array.from(new Set(ledgers.filter((l) => l.orderId).map((l) => l.orderId)));
    let sumSwapped = 0;
    for (const ordId of orderIds) {
      const ordLedgers = ledgers.filter((l) => l.orderId === ordId);
      const delivered = ordLedgers
        .filter((l) => l.transactionType === 'DELIVERY_TO_CUSTOMER')
        .reduce((sum, l) => sum + Math.abs(l.fullDelta), 0);
      const recovered = ordLedgers
        .filter((l) => l.transactionType === 'EMPTY_RECOVERY_FROM_CUSTOMER')
        .reduce((sum, l) => sum + l.emptyDelta, 0);
      sumSwapped += Math.min(delivered, recovered);
    }

    const expectedEmpties = shift.startEmptyCylinders + sumRecovered;

    // 3. Odometer and Stock changes
    const expectedCash = shift.expectedCash;
    const cashVariance = dto.physicalCashCollected - expectedCash;
    const emptyVariance = dto.endEmptyCylinders - expectedEmpties;

    // Find warehouse ID from the loading ledger record
    const loadingLedger = ledgers.find((l) => l.transactionType === 'LOADING_TO_TRUCK');
    if (!loadingLedger || !loadingLedger.warehouseId) {
      throw new BadRequestException('Could not identify warehouse associated with this truck loading.');
    }
    const warehouseId = loadingLedger.warehouseId;

    // Get all orders completed in this shift
    const shiftOrders = await this.prisma.order.findMany({
      where: {
        shiftSessionId,
        status: 'DELIVERED_UNVERIFIED',
      },
    });

    const creditSales = shiftOrders
      .filter((o) => o.paymentTerms === 'CREDIT')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const cashSales = shiftOrders
      .filter((o) => o.paymentTerms === 'CASH_ON_DELIVERY')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const chequeSales = shiftOrders
      .filter((o) => o.paymentTerms === 'CHEQUE_ON_DELIVERY')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Sum approved expenses for this shift
    const approvedExpenses = await this.prisma.expenseClaim.findMany({
      where: {
        shiftSessionId,
        status: 'APPROVED',
      },
    });
    const totalExpenses = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Execute database changes in transaction
    await this.prisma.$transaction(async (tx) => {
      // A. Update orders from DELIVERED_UNVERIFIED -> COMPLETED
      await tx.order.updateMany({
        where: {
          shiftSessionId,
          status: 'DELIVERED_UNVERIFIED',
        },
        data: {
          status: 'COMPLETED',
        },
      });

      // B. Update paymentStatus to PAID for COD and Cheque sales
      await tx.order.updateMany({
        where: {
          shiftSessionId,
          paymentTerms: {
            in: ['CASH_ON_DELIVERY', 'CHEQUE_ON_DELIVERY'],
          },
          status: 'COMPLETED',
        },
        data: {
          paymentStatus: 'PAID',
        },
      });

      // C. Return cylinders to warehouse stock
      const endDamaged = dto.endDamagedCylinders ?? 0;
      await tx.warehouse.update({
        where: { id: warehouseId },
        data: {
          fullCylinderStock: {
            increment: dto.endFullCylinders,
          },
          emptyCylinderStock: {
            increment: dto.endEmptyCylinders,
          },
          damagedCylinderStock: {
            increment: endDamaged,
          },
        },
      });

      // D. Log the unloading of cylinders in CylinderLedger
      await tx.cylinderLedger.create({
        data: {
          tenantId: shift.tenantId,
          warehouseId,
          driverId: shift.driverId,
          shiftSessionId,
          fullDelta: dto.endFullCylinders,
          emptyDelta: dto.endEmptyCylinders,
          damagedDelta: endDamaged,
          transactionType: 'UNLOADING_FROM_TRUCK',
          notes: `Unloaded truck ${shift.truckId} back to warehouse at Driver Settlement / Shift Reconciliation.`,
        },
      });

      // E. Update shift status to RECONCILED and store ending values
      await tx.driverShift.update({
        where: { id: shiftSessionId },
        data: {
          status: 'RECONCILED',
          endFullCylinders: dto.endFullCylinders,
          endEmptyCylinders: dto.endEmptyCylinders,
          endDamagedCylinders: endDamaged,
          physicalCashCollected: dto.physicalCashCollected,
          cashVariance,
          reconciledById: dto.reconciledById,
          reconciliationNotes: dto.reconciliationNotes ?? null,
        },
      });
    });

    // 4. Post Double-Entry Ledger journal entry
    const accounts = await this.prisma.financialAccount.findMany({
      where: { tenantId: shift.tenantId },
    });

    const cashInHandAcc = accounts.find((a) => a.code === '1000');
    const accountsReceivableAcc = accounts.find((a) => a.code === '1200');
    const driverSuspenseAcc = accounts.find((a) => a.code === '1400');
    const revenueAcc = accounts.find((a) => a.code === '4000');
    const expensesAcc = accounts.find((a) => a.code === '5000');

    if (!cashInHandAcc || !accountsReceivableAcc || !driverSuspenseAcc || !revenueAcc || !expensesAcc) {
      throw new BadRequestException(
        `Chart of Accounts is incomplete for tenant ${shift.tenantId}. Please ensure accounts with codes '1000', '1200', '1400', '4000', and '5000' are defined.`
      );
    }

    const journalEntries = [];
    const startingCash = expectedCash - (cashSales + chequeSales) + totalExpenses;
    const netCash = dto.physicalCashCollected - startingCash;

    // Credit revenue for all sales completed in the shift
    const totalSales = creditSales + cashSales + chequeSales;
    if (totalSales > 0) {
      journalEntries.push({
        accountId: revenueAcc.id,
        credit: totalSales,
      });
    }

    // Debit expenses for approved cash expenses
    if (totalExpenses > 0) {
      journalEntries.push({
        accountId: expensesAcc.id,
        debit: totalExpenses,
        shiftSessionId,
      });
    }

    // Debit receivables for CREDIT sales
    for (const o of shiftOrders) {
      if (o.paymentTerms === 'CREDIT') {
        journalEntries.push({
          accountId: accountsReceivableAcc.id,
          debit: o.totalAmount,
          customerId: o.customerId,
          orderId: o.id,
          shiftSessionId,
        });
      }
    }

    // Cash in Hand net change
    if (netCash > 0) {
      journalEntries.push({
        accountId: cashInHandAcc.id,
        debit: netCash,
        shiftSessionId,
      });
    } else if (netCash < 0) {
      journalEntries.push({
        accountId: cashInHandAcc.id,
        credit: Math.abs(netCash),
        shiftSessionId,
      });
    }

    // Debit Driver Suspense Cash if shortage, or Credit Revenue if overage
    if (cashVariance < 0) {
      journalEntries.push({
        accountId: driverSuspenseAcc.id,
        debit: Math.abs(cashVariance),
        userId: shift.driverId,
        shiftSessionId,
      });
    } else if (cashVariance > 0) {
      journalEntries.push({
        accountId: revenueAcc.id,
        credit: cashVariance,
      });
    }

    // Post to ledger if there is any financial movement
    let ledgerResult = null;
    const totalDebit = journalEntries.reduce((sum, je) => sum + (je.debit ?? 0), 0);
    const totalCredit = journalEntries.reduce((sum, je) => sum + (je.credit ?? 0), 0);

    if (totalDebit > 0 || totalCredit > 0) {
      ledgerResult = await this.ledgerService.postJournalEntry({
        tenantId: shift.tenantId,
        description: `EOD Driver Settlement / Shift Reconciliation for driver ${shift.driver.name} (Dispatch Session: ${shiftSessionId})`,
        transactionType: 'GENERAL_ADJUSTMENT',
        entries: journalEntries,
      });
    }

    if (ledgerResult && ledgerResult.batchId) {
      for (const o of shiftOrders) {
        if (o.paymentTerms === 'CASH_ON_DELIVERY' || o.paymentTerms === 'CHEQUE_ON_DELIVERY') {
          const cust = await this.prisma.customer.findUnique({
            where: { id: o.customerId },
          });
          if (cust) {
            await this.whatsapp.sendPaymentCloseout(
              cust.phoneNumber || 'unknown',
              cust.name,
              o.totalAmount,
              o.paymentTerms,
              ledgerResult.batchId,
            ).catch((err) => console.error('Failed to send WhatsApp payment closeout alert:', err));
          }
        }
      }
    }

    return {
      shiftSessionId,
      status: 'RECONCILED',
      expectedCash,
      expectedEmpties,
      cashVariance,
      emptyVariance,
      ledgerResult,
    };
  }

  /**
   * Get active shift session for a driver
   */
  async getActiveShift(driverId: string) {
    const shift = await this.prisma.driverShift.findFirst({
      where: {
        driverId,
        status: 'ACTIVE',
      },
      include: {
        orders: {
          include: {
            customer: true,
          },
        },
      },
    });

    // Return null when no active shift (driver is off-duty) — callers handle null gracefully
    return shift ?? null;
  }

  /**
   * Get specific shift details
   */
  async getShiftDetails(id: string) {
    const shift = await this.prisma.driverShift.findUnique({
      where: { id },
      include: {
        driver: { select: { id: true, name: true, email: true } },
        reconciledBy: { select: { id: true, name: true } },
        orders: {
          include: {
            customer: true,
          },
        },
        expenseClaims: true,
        cylinderLedgers: true,
      },
    });

    if (!shift) {
      throw new NotFoundException(`Dispatch session with ID ${id} not found.`);
    }

    return shift;
  }
}
