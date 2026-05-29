import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsBoolean } from 'class-validator';

export class LogDeliveryDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  @Min(0)
  recoveredQuantity: number;

  @IsString()
  @IsOptional()
  customerSignature?: string;

  @IsString()
  @IsOptional()
  deliveryPhoto?: string;

  @IsBoolean()
  @IsOptional()
  indirectHandover?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  deliveryLatitude?: number;

  @IsNumber()
  @IsOptional()
  deliveryLongitude?: number;
}
