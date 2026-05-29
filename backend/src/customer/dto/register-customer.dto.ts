import { IsString, IsNotEmpty, IsEmail, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  SUSPENDED = 'SUSPENDED',
}

export class RegisterCustomerDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  creditLimit?: number;

  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;
}
