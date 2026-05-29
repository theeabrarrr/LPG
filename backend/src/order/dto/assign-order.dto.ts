import { IsString, IsNotEmpty } from 'class-validator';

export class AssignOrderDto {
  @IsString()
  @IsNotEmpty()
  driverId: string;

  @IsString()
  @IsNotEmpty()
  shiftSessionId: string;
}
