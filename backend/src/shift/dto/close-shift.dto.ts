import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class CloseShiftDto {
  @IsNumber()
  @Min(0)
  physicalCashCollected: number;

  @IsNumber()
  @Min(0)
  endFullCylinders: number;

  @IsNumber()
  @Min(0)
  endEmptyCylinders: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  endDamagedCylinders?: number;

  @IsString()
  @IsOptional()
  reconciliationNotes?: string;

  @IsString()
  @IsNotEmpty()
  reconciledById: string;
}
