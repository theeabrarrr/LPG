import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerService } from '../customer/customer.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AssignOrderDto } from './dto/assign-order.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customerService: CustomerService,
  ) {}

  /**
   * Create a new cylinder refilling order
   */
  async createOrder(dto: CreateOrderDto) {
    // 1. Verify Customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found.`);
    }

    if (customer.tenantId !== dto.tenantId) {
      throw new BadRequestException(`Customer does not belong to tenant ${dto.tenantId}`);
    }

    // 2. Verify Warehouse exists
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${dto.warehouseId} not found.`);
    }

    if (warehouse.tenantId !== dto.tenantId) {
      throw new BadRequestException(`Warehouse does not belong to tenant ${dto.tenantId}`);
    }

    if (warehouse.fullCylinderStock < dto.quantity) {
      throw new BadRequestException(
        `Insufficient full cylinder stock in warehouse. Required: ${dto.quantity}, Available: ${warehouse.fullCylinderStock}`
      );
    }

    const totalAmount = dto.quantity * dto.unitPrice;

    // 3. Perform credit eligibility check
    let initialStatus: 'DRAFT' | 'BLOCKED' = 'DRAFT';
    const creditCheck = await this.customerService.checkCreditEligibility(dto.customerId, totalAmount);
    if (!creditCheck.eligible) {
      initialStatus = 'BLOCKED';
    }

    // 4. Create the order inside transaction. If DRAFT, decrement stock and log ledger entry
    return this.prisma.$transaction(async (tx) => {
      if (initialStatus === 'DRAFT') {
        // Re-verify stock inside transaction
        const currentWarehouse = await tx.warehouse.findUnique({
          where: { id: dto.warehouseId },
        });
        if (!currentWarehouse) {
          throw new NotFoundException(`Warehouse with ID ${dto.warehouseId} not found.`);
        }
        if (currentWarehouse.fullCylinderStock < dto.quantity) {
          throw new BadRequestException(
            `Insufficient full cylinder stock in warehouse. Required: ${dto.quantity}, Available: ${currentWarehouse.fullCylinderStock}`
          );
        }

        // Decrement stock
        await tx.warehouse.update({
          where: { id: dto.warehouseId },
          data: {
            fullCylinderStock: {
              decrement: dto.quantity,
            },
          },
        });
      }

      // Create order
      const order = await tx.order.create({
        data: {
          tenantId: dto.tenantId,
          customerId: dto.customerId,
          warehouseId: dto.warehouseId,
          quantity: dto.quantity,
          unitPrice: dto.unitPrice,
          totalAmount,
          paymentTerms: dto.paymentTerms,
          paymentStatus: 'UNPAID',
          status: initialStatus,
          deliveryLatitude: dto.deliveryLatitude ?? null,
          deliveryLongitude: dto.deliveryLongitude ?? null,
          notes: dto.notes ?? null,
        },
      });

      if (initialStatus === 'DRAFT') {
        // Create CylinderLedger entry
        await tx.cylinderLedger.create({
          data: {
            tenantId: dto.tenantId,
            warehouseId: dto.warehouseId,
            customerId: dto.customerId,
            orderId: order.id,
            fullDelta: -dto.quantity,
            transactionType: 'ORDER_STOCK_DEBIT',
            notes: `Stock debit for order ${order.id}`,
          },
        });
      }

      return order;
    });
  }

  /**
   * Assign order to a driver and shift session (DRAFT -> ASSIGNED)
   */
  async assignOrder(orderId: string, dto: AssignOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found.`);
    }

    if (order.status !== 'DRAFT' && order.status !== 'BLOCKED') {
      if ((order.status === 'ASSIGNED' || order.status === 'IN_TRANSIT') &&
          order.driverId === dto.driverId &&
          order.shiftSessionId === dto.shiftSessionId) {
        return order;
      }
      throw new BadRequestException(`Order cannot be assigned because its current status is ${order.status}. Only DRAFT or BLOCKED orders can be assigned.`);
    }

    // Verify driver exists
    const driver = await this.prisma.user.findUnique({
      where: { id: dto.driverId },
    });
    if (!driver || driver.role !== 'DRIVER') {
      throw new BadRequestException(`Driver with ID ${dto.driverId} does not exist or does not have DRIVER role.`);
    }

    // Verify active shift session exists
    const shift = await this.prisma.driverShift.findUnique({
      where: { id: dto.shiftSessionId },
    });
    if (!shift) {
      throw new NotFoundException(`Dispatch session with ID ${dto.shiftSessionId} not found.`);
    }

    if (shift.driverId !== dto.driverId) {
      throw new BadRequestException(`Dispatch session ${dto.shiftSessionId} does not belong to driver ${dto.driverId}.`);
    }

    if (shift.status !== 'ACTIVE') {
      throw new BadRequestException(`Dispatch session ${dto.shiftSessionId} is not active (Status: ${shift.status}).`);
    }

    // Check if customer is blocked. If customer is BLOCKED, they must be unblocked first.
    const customer = await this.prisma.customer.findUnique({
      where: { id: order.customerId },
    });
    if (customer && customer.status === 'BLOCKED') {
      throw new BadRequestException(`Cannot assign order. Customer ${customer.name} is BLOCKED.`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (order.status === 'BLOCKED') {
        // Re-verify stock inside transaction
        const currentWarehouse = await tx.warehouse.findUnique({
          where: { id: order.warehouseId },
        });
        if (!currentWarehouse) {
          throw new NotFoundException(`Warehouse with ID ${order.warehouseId} not found.`);
        }
        if (currentWarehouse.fullCylinderStock < order.quantity) {
          throw new BadRequestException(
            `Insufficient full cylinder stock in warehouse. Required: ${order.quantity}, Available: ${currentWarehouse.fullCylinderStock}`
          );
        }

        // Decrement stock
        await tx.warehouse.update({
          where: { id: order.warehouseId },
          data: {
            fullCylinderStock: {
              decrement: order.quantity,
            },
          },
        });

        // Create CylinderLedger entry
        await tx.cylinderLedger.create({
          data: {
            tenantId: order.tenantId,
            warehouseId: order.warehouseId,
            customerId: order.customerId,
            orderId: order.id,
            driverId: dto.driverId,
            shiftSessionId: dto.shiftSessionId,
            fullDelta: -order.quantity,
            transactionType: 'ORDER_STOCK_DEBIT',
            notes: `Stock debit for unblocked order ${order.id} upon assignment`,
          },
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          driverId: dto.driverId,
          shiftSessionId: dto.shiftSessionId,
          status: 'ASSIGNED',
        },
      });
    });
  }

  /**
   * Dispatch the vehicle and transit the order (ASSIGNED -> IN_TRANSIT)
   */
  async dispatchOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found.`);
    }

    if (order.status !== 'ASSIGNED') {
      if (order.status === 'IN_TRANSIT') {
        return order;
      }
      throw new BadRequestException(`Order cannot be dispatched. Status must be ASSIGNED. Current status: ${order.status}`);
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'IN_TRANSIT',
      },
    });
  }

  /**
   * Get specific order details
   */
  async getOrderDetails(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        warehouse: true,
        driver: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found.`);
    }

    return order;
  }

  /**
   * Get all orders for a tenant
   */
  async getOrdersByTenant(tenantId: string) {
    return this.prisma.order.findMany({
      where: { tenantId },
      include: {
        customer: { select: { id: true, name: true, address: true } },
        driver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all warehouses for a tenant
   */
  async getWarehousesByTenant(tenantId: string) {
    return this.prisma.warehouse.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Update warehouse stock values manually
   */
  async updateWarehouseStock(
    warehouseId: string,
    tenantId: string,
    dto: { fullChange: number; emptyChange: number; damagedChange: number },
  ) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found.`);
    }
    if (warehouse.tenantId !== tenantId) {
      throw new BadRequestException(`Warehouse does not belong to tenant ${tenantId}`);
    }

    const updated = await this.prisma.warehouse.update({
      where: { id: warehouseId },
      data: {
        fullCylinderStock: { increment: dto.fullChange },
        emptyCylinderStock: { increment: dto.emptyChange },
        damagedCylinderStock: { increment: dto.damagedChange },
      },
    });

    // Log the transaction in CylinderLedger
    await this.prisma.cylinderLedger.create({
      data: {
        tenantId,
        warehouseId,
        fullDelta: dto.fullChange,
        emptyDelta: dto.emptyChange,
        damagedDelta: dto.damagedChange,
        transactionType: dto.fullChange > 0 ? 'REFILL_RECEIPT_FROM_PLANT' : 'REFILL_DISPATCH_TO_PLANT',
        notes: `Manual stock adjustment/refill logged via Warehouse Stock Manager.`,
      },
    });

    return updated;
  }
}
