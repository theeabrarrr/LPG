import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class LedgerEntryDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  debit?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  credit?: number;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  shiftSessionId?: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  expenseClaimId?: string;
}

export class PostJournalEntryDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  transactionType: string;

  @ValidateNested({ each: true })
  @Type(() => LedgerEntryDto)
  @ArrayMinSize(2, { message: 'A journal entry must contain at least 2 ledger entries for double-entry.' })
  entries: LedgerEntryDto[];
}
