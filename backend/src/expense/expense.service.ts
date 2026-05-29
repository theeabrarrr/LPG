import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseClaimDto } from './dto/create-expense-claim.dto';
import { ApproveExpenseDto } from './dto/approve-expense.dto';

@Injectable()
export class ExpenseService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Driver logs a road expense claim
   */
  async createExpenseClaim(dto: CreateExpenseClaimDto) {
    // 1. Validation: if expense >= Rs. 1000, receiptUrl is mandatory
    if (dto.amount >= 1000 && !dto.receiptUrl) {
      throw new BadRequestException('Payment Receipt Capture is mandatory for claims of Rs. 1000 or more (Macro-expenses).');
    }



    // 3. Validation: check receiptHash in database before posting to prevent duplicates
    if (dto.receiptHash) {
      const duplicate = await this.prisma.expenseClaim.findFirst({
        where: {
          tenantId: dto.tenantId,
          receiptHash: dto.receiptHash,
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          `Duplicate receipt upload detected. An expense claim with this receipt has already been logged (ID: ${duplicate.id}).`
        );
      }
    }

    // 4. Verify Driver and active shift session
    const driver = await this.prisma.user.findUnique({
      where: { id: dto.driverId },
    });
    if (!driver || driver.role !== 'DRIVER') {
      throw new BadRequestException(`Driver with ID ${dto.driverId} does not exist.`);
    }

    const shift = await this.prisma.driverShift.findUnique({
      where: { id: dto.shiftSessionId },
    });
    if (!shift) {
      throw new NotFoundException(`Dispatch session with ID ${dto.shiftSessionId} not found.`);
    }
    if (shift.driverId !== dto.driverId) {
      throw new BadRequestException(`Dispatch session does not belong to driver ${dto.driverId}.`);
    }
    if (shift.status !== 'ACTIVE') {
      throw new BadRequestException(`Dispatch session ${dto.shiftSessionId} is not ACTIVE (Current status: ${shift.status}).`);
    }

    return this.prisma.expenseClaim.create({
      data: {
        tenantId: dto.tenantId,
        driverId: dto.driverId,
        shiftSessionId: dto.shiftSessionId,
        category: dto.category,
        amount: dto.amount,
        description: dto.description ?? null,
        receiptUrl: dto.receiptUrl ?? null,
        receiptHash: dto.receiptHash ?? null,
        odometer: dto.odometer ?? null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        status: 'AWAITING_APPROVAL',
      },
    });
  }

  /**
   * Accountant reviews and updates status of expense claim
   */
  async approveExpenseClaim(claimId: string, dto: ApproveExpenseDto) {
    const claim = await this.prisma.expenseClaim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException(`Expense claim with ID ${claimId} not found.`);
    }

    if (claim.status !== 'AWAITING_APPROVAL') {
      throw new BadRequestException(`Expense claim has already been processed (Current status: ${claim.status}).`);
    }

    // Verify approver exists and is an Accountant or Owner
    const approver = await this.prisma.user.findUnique({
      where: { id: dto.approvedById },
    });
    if (!approver || (approver.role !== 'ACCOUNTANT' && approver.role !== 'BUSINESS_OWNER' && approver.role !== 'SUPER_ADMIN')) {
      throw new BadRequestException(`User ${dto.approvedById} is not authorized to approve expenses.`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update the claim status
      const updatedClaim = await tx.expenseClaim.update({
        where: { id: claimId },
        data: {
          status: dto.status,
          approvedById: dto.approvedById,
          approvalNotes: dto.approvalNotes ?? null,
        },
      });

      // 2. If approved, modify the expected cash in the driver's shift session
      if (dto.status === 'APPROVED') {
        const shift = await tx.driverShift.findUnique({
          where: { id: claim.shiftSessionId },
        });

        if (shift && shift.status === 'ACTIVE') {
          await tx.driverShift.update({
            where: { id: claim.shiftSessionId },
            data: {
              expectedCash: {
                decrement: claim.amount,
              },
            },
          });
        }
      }

      return updatedClaim;
    });
  }

  /**
   * Get all expense claims for a shift session
   */
  async getExpenseClaimsByShift(shiftSessionId: string) {
    return this.prisma.expenseClaim.findMany({
      where: { shiftSessionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all expense claims for a tenant
   */
  async getExpenseClaimsByTenant(tenantId: string) {
    return this.prisma.expenseClaim.findMany({
      where: { tenantId },
      include: {
        driver: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
