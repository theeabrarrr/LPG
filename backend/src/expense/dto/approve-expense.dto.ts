import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class ApproveExpenseDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';

  @IsString()
  @IsNotEmpty()
  approvedById: string;

  @IsString()
  @IsOptional()
  approvalNotes?: string;
}
