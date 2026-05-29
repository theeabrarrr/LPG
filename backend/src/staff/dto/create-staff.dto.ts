import { IsString, IsNotEmpty, IsEmail, IsOptional, Length } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  @Length(4, 4)
  pin?: string;

  @IsString()
  @IsOptional()
  password?: string;
}
