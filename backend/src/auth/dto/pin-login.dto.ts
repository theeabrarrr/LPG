import { IsString, Length } from 'class-validator';

export class PinLoginDto {
  @IsString()
  @Length(4, 8)
  pin: string;

  @IsString()
  tenantId: string;
}
