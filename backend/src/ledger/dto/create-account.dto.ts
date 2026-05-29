import { IsString, IsNotEmpty, IsEnum, Matches } from 'class-validator';

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, { message: 'Account code must be a 4-digit numeric string (e.g. 1000, 1100)' })
  code: string;

  @IsEnum(AccountType, { message: 'Type must be ASSET, LIABILITY, EQUITY, REVENUE, or EXPENSE' })
  type: AccountType;
}
