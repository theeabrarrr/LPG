import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, HttpCode, Patch } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { PostJournalEntryDto } from './dto/post-journal-entry.dto';

@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

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
