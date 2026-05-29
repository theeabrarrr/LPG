import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { PostJournalEntryDto } from './dto/post-journal-entry.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class LedgerService {
  constructor(public readonly prisma: PrismaService) {}

  /**
   * Create a new Financial Account in the Chart of Accounts
   */
  async createAccount(dto: CreateAccountDto) {
    const existing = await this.prisma.financialAccount.findUnique({
      where: {
        tenantId_code: {
          tenantId: dto.tenantId,
          code: dto.code,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Account with code ${dto.code} already exists for tenant ${dto.tenantId}`);
    }

    return this.prisma.financialAccount.create({
      data: {
        tenantId: dto.tenantId,
        name: dto.name,
        code: dto.code,
        type: dto.type,
        balance: 0.0,
      },
    });
  }

  /**
   * Get all Financial Accounts for a tenant
   */
  async getAccountsByTenant(tenantId: string) {
    return this.prisma.financialAccount.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Get ledger entries for a tenant
   */
  async getLedgerEntries(tenantId: string) {
    return this.prisma.financialLedger.findMany({
      where: { tenantId },
      include: { account: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Post a double-entry journal transaction
   */
  async postJournalEntry(dto: PostJournalEntryDto) {
    const { tenantId, description, transactionType, entries } = dto;

    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of entries) {
      const db = entry.debit || 0;
      const cr = entry.credit || 0;

      if (db < 0 || cr < 0) {
        throw new BadRequestException('Debit and credit values must be non-negative.');
      }
      if (db > 0 && cr > 0) {
        throw new BadRequestException('An entry line cannot contain both debit and credit amounts.');
      }
      if (db === 0 && cr === 0) {
        throw new BadRequestException('An entry line must contain either a debit or credit amount greater than 0.');
      }

      totalDebit += db;
      totalCredit += cr;
    }

    const roundedDebit = Math.round(totalDebit * 100) / 100;
    const roundedCredit = Math.round(totalCredit * 100) / 100;

    if (roundedDebit !== roundedCredit) {
      throw new BadRequestException(
        `Double-entry ledger rule violation: Sum of debits (${roundedDebit}) must equal sum of credits (${roundedCredit}) exactly.`
      );
    }

    if (roundedDebit === 0) {
      throw new BadRequestException('Transaction amount must be greater than zero.');
    }

    const batchId = randomUUID();

    return this.prisma.$transaction(async (tx) => {
      const createdEntries = [];

      for (const entry of entries) {
        const account = await tx.financialAccount.findUnique({
          where: { id: entry.accountId },
        });

        if (!account) {
          throw new NotFoundException(`Financial Account with ID ${entry.accountId} not found.`);
        }

        if (account.tenantId !== tenantId) {
          throw new BadRequestException(`Account ${account.name} does not belong to tenant ${tenantId}.`);
        }

        const debitAmount = entry.debit || 0;
        const creditAmount = entry.credit || 0;

        // Assets & Expenses: normal DEBIT balance (debit increases, credit decreases)
        // Liabilities, Equity, Revenues: normal CREDIT balance (credit increases, debit decreases)
        let balanceAdjustment = 0;
        if (account.type === 'ASSET' || account.type === 'EXPENSE') {
          balanceAdjustment = debitAmount - creditAmount;
        } else {
          balanceAdjustment = creditAmount - debitAmount;
        }

        await tx.financialAccount.update({
          where: { id: account.id },
          data: {
            balance: {
              increment: balanceAdjustment,
            },
          },
        });

        // Sync to Customer's creditBalance if Accounts Receivable (code 1200) is updated
        if (entry.customerId && account.code === '1200') {
          const customer = await tx.customer.findUnique({
            where: { id: entry.customerId },
          });

          if (!customer) {
            throw new NotFoundException(`Customer with ID ${entry.customerId} not found.`);
          }

          // Accounts Receivable is an ASSET, so debit increases and credit decreases the receivables balance.
          const customerBalanceAdjustment = debitAmount - creditAmount;

          await tx.customer.update({
            where: { id: entry.customerId },
            data: {
              creditBalance: {
                increment: customerBalanceAdjustment,
              },
            },
          });
        }

        const ledgerLine = await tx.financialLedger.create({
          data: {
            tenantId,
            batchId,
            accountId: entry.accountId,
            debit: debitAmount,
            credit: creditAmount,
            customerId: entry.customerId || null,
            userId: entry.userId || null,
            shiftSessionId: entry.shiftSessionId || null,
            orderId: entry.orderId || null,
            expenseClaimId: entry.expenseClaimId || null,
            description,
            transactionType,
          },
        });

        createdEntries.push(ledgerLine);
      }

      return {
        batchId,
        entries: createdEntries,
      };
    });
  }

  /**
   * Calculate Accounts Receivable (A/R) aging for a tenant
   */
  async getARAging(tenantId: string) {
    // Fetch all customers for the tenant, including their unpaid or partially paid credit orders
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      include: {
        orders: {
          where: {
            paymentTerms: 'CREDIT',
            paymentStatus: { in: ['UNPAID', 'PARTIALLY_PAID'] },
            status: { notIn: ['DRAFT', 'BLOCKED', 'CANCELLED'] },
          },
        },
      },
    });

    const now = new Date();

    return customers.map((customer) => {
      let bracket0to30 = 0;
      let bracket31to60 = 0;
      let bracket61to90 = 0;
      let bracketOver90 = 0;

      for (const order of customer.orders) {
        const ageInMs = now.getTime() - order.createdAt.getTime();
        const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));

        if (ageInDays <= 30) {
          bracket0to30 += order.totalAmount;
        } else if (ageInDays <= 60) {
          bracket31to60 += order.totalAmount;
        } else if (ageInDays <= 90) {
          bracket61to90 += order.totalAmount;
        } else {
          bracketOver90 += order.totalAmount;
        }
      }

      return {
        customerId: customer.id,
        customerName: customer.name,
        creditLimit: customer.creditLimit,
        creditBalance: customer.creditBalance,
        brackets: {
          '0-30': bracket0to30,
          '31-60': bracket31to60,
          '61-90': bracket61to90,
          '90+': bracketOver90,
        },
        totalUnpaid: bracket0to30 + bracket31to60 + bracket61to90 + bracketOver90,
      };
    });
  }

  /**
   * Block destructive update operations
   */
  async update() {
    throw new ForbiddenException('Destructive updates are blocked on FinancialLedger entries for audit and fraud prevention.');
  }

  /**
   * Block destructive delete operations
   */
  async delete() {
    throw new ForbiddenException('Destructive deletions are blocked on FinancialLedger entries for audit and fraud prevention.');
  }

  /**
   * Retrieve Accounts Receivable (AR) Aging for all customers of a tenant
   */
  async getArAging(tenantId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        creditLimit: true,
        creditBalance: true,
      },
    });

    const arAccount = await this.prisma.financialAccount.findFirst({
      where: { tenantId, code: '1200' }
    });

    const agingReport = [];

    for (const customer of customers) {
      const report = {
        customerId: customer.id,
        customerName: customer.name,
        creditLimit: customer.creditLimit,
        totalOutstanding: customer.creditBalance,
        current: 0,
        thirtyToSixty: 0,
        sixtyToNinety: 0,
        overNinety: 0,
      };

      if (customer.creditBalance > 0 && arAccount) {
        // Find all debit postings to Accounts Receivable (code 1200) for this customer
        const debits = await this.prisma.financialLedger.findMany({
          where: {
            tenantId,
            accountId: arAccount.id,
            customerId: customer.id,
            debit: { gt: 0 }
          },
          orderBy: { createdAt: 'desc' }
        });

        let remainingBalance = customer.creditBalance;
        const now = new Date();

        for (const entry of debits) {
          if (remainingBalance <= 0) break;
          const ageInDays = Math.floor((now.getTime() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24));
          const amountToAllocate = Math.min(remainingBalance, entry.debit);

          if (ageInDays <= 30) {
            report.current += amountToAllocate;
          } else if (ageInDays <= 60) {
            report.thirtyToSixty += amountToAllocate;
          } else if (ageInDays <= 90) {
            report.sixtyToNinety += amountToAllocate;
          } else {
            report.overNinety += amountToAllocate;
          }
          remainingBalance -= amountToAllocate;
        }

        // Allocate any remaining balance that wasn't matched to recent debits to the oldest bin
        if (remainingBalance > 0) {
          report.overNinety += remainingBalance;
        }
      }

      // Round all values to 2 decimal places
      report.current = Math.round(report.current * 100) / 100;
      report.thirtyToSixty = Math.round(report.thirtyToSixty * 100) / 100;
      report.sixtyToNinety = Math.round(report.sixtyToNinety * 100) / 100;
      report.overNinety = Math.round(report.overNinety * 100) / 100;
      report.totalOutstanding = Math.round(report.totalOutstanding * 100) / 100;

      agingReport.push(report);
    }

    return agingReport;
  }
}
