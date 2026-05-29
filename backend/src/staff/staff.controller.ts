import { Controller, Get, Post, Patch, Delete, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStaff(@Body() dto: CreateStaffDto) {
    return this.staffService.createStaff(dto);
  }

  @Get('tenant/:tenantId')
  async getStaffByTenant(@Param('tenantId') tenantId: string) {
    return this.staffService.getStaffByTenant(tenantId);
  }

  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.staffService.updateStaffRole(id, role);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.staffService.updateStaffStatus(id, isActive);
  }

  @Patch(':id/pin')
  async updatePin(@Param('id') id: string, @Body('pin') pin: string) {
    return this.staffService.updateStaffPin(id, pin);
  }

  @Patch(':id/password')
  async changePassword(@Param('id') id: string, @Body('password') password: string) {
    return this.staffService.changePassword(id, password);
  }

  @Delete(':id')
  async deleteStaff(@Param('id') id: string) {
    return this.staffService.deleteStaff(id);
  }
}
