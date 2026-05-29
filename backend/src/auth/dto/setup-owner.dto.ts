import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class SetupOwnerDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
