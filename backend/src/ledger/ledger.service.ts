import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { PostJournalEntryDto } from './dto/post-journal-entry.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

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
}
