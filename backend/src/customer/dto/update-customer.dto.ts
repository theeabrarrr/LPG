import { IsString, IsOptional, IsEmail, IsNumber, Min, IsEnum } from 'class-validator';
import { CustomerStatus } from './register-customer.dto';

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  name?: string;

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
