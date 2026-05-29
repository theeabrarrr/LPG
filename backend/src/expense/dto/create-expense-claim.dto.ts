import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';

export class CreateExpenseClaimDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  driverId: string;

  @IsString()
  @IsNotEmpty()
  shiftSessionId: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['FUEL', 'TOLL', 'MAINTENANCE', 'MEALS', 'MISC'])
  category: 'FUEL' | 'TOLL' | 'MAINTENANCE' | 'MEALS' | 'MISC';

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @IsString()
  @IsOptional()
  receiptHash?: string;

  @IsNumber()
  @IsOptional()
  odometer?: number;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}
