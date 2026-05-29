import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ShiftService } from './shift.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { LogDeliveryDto } from './dto/log-delivery.dto';
import { CloseShiftDto } from './dto/close-shift.dto';

@Controller('shifts')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post('open')
  @HttpCode(HttpStatus.CREATED)
  async openShift(@Body() dto: OpenShiftDto) {
    return this.shiftService.openShift(dto);
  }

  @Post('delivery')
  @HttpCode(HttpStatus.OK)
  async logDelivery(@Body() dto: LogDeliveryDto) {
    return this.shiftService.logDelivery(dto);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  async closeShift(@Param('id') id: string, @Body() dto: CloseShiftDto) {
    return this.shiftService.closeShift(id, dto);
  }

  @Get('active/:driverId')
  async getActiveShift(@Param('driverId') driverId: string) {
    return this.shiftService.getActiveShift(driverId);
  }

  @Get(':id')
  async getShiftDetails(@Param('id') id: string) {
    return this.shiftService.getShiftDetails(id);
  }
}
