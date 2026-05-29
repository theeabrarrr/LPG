import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0.01)
  unitPrice: number;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['CASH_ON_DELIVERY', 'CHEQUE_ON_DELIVERY', 'CREDIT'])
  paymentTerms: 'CASH_ON_DELIVERY' | 'CHEQUE_ON_DELIVERY' | 'CREDIT';

  @IsNumber()
  @IsOptional()
  deliveryLatitude?: number;

  @IsNumber()
  @IsOptional()
  deliveryLongitude?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
