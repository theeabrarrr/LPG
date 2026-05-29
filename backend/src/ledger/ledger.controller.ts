import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, HttpCode, Patch, Query, BadRequestException } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { PostJournalEntryDto } from './dto/post-journal-entry.dto';

@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('ar-aging')
  async getARAging(@Query('tenantId') tenantId?: string) {
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
      // Fallback: look up the first tenant if none is provided to be resilient
      const accounts = await this.ledgerService.prisma?.tenant?.findFirst();
      resolvedTenantId = accounts?.id;
    }
    if (!resolvedTenantId) {
      throw new BadRequestException('tenantId query parameter is required.');
    }
    return this.ledgerService.getARAging(resolvedTenantId);
  }

  @Post('accounts')
  @HttpCode(HttpStatus.CREATED)
  async createAccount(@Body() dto: CreateAccountDto) {
    return this.ledgerService.createAccount(dto);
  }

  @Get('accounts/:tenantId')
  async getAccounts(@Param('tenantId') tenantId: string) {
    return this.ledgerService.getAccountsByTenant(tenantId);
  }

  @Post('entries')
  @HttpCode(HttpStatus.CREATED)
  async postJournalEntry(@Body() dto: PostJournalEntryDto) {
    return this.ledgerService.postJournalEntry(dto);
  }

  @Get('entries/:tenantId')
  async getLedgerEntries(@Param('tenantId') tenantId: string) {
    return this.ledgerService.getLedgerEntries(tenantId);
  }

  @Get('ar-aging/:tenantId')
  async getArAging(@Param('tenantId') tenantId: string) {
    return this.ledgerService.getArAging(tenantId);
  }

  @Put('entries/:id')
  async updateEntry() {
    return this.ledgerService.update();
  }

  @Patch('entries/:id')
  async patchEntry() {
    return this.ledgerService.update();
  }

  @Delete('entries/:id')
  async deleteEntry() {
    return this.ledgerService.delete();
  }
}
