import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsArray } from 'class-validator';

export class OpenShiftDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  driverId: string;

  @IsString()
  @IsNotEmpty()
  truckId: string;

  @IsNumber()
  @Min(0)
  startFullCylinders: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  startEmptyCylinders?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  startCash?: number;

  @IsString()
  @IsNotEmpty()
  warehouseId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  orderIds?: string[];
}
