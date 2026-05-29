import { Controller, Get, Post, Patch, Body, Param, Query, HttpStatus, HttpCode } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async registerCustomer(@Body() dto: RegisterCustomerDto) {
    return this.customerService.registerCustomer(dto);
  }

  @Get('tenant/:tenantId')
  async getCustomersByTenant(@Param('tenantId') tenantId: string) {
    return this.customerService.getCustomersByTenant(tenantId);
  }

  @Get(':id')
  async getCustomerDetails(@Param('id') id: string) {
    return this.customerService.getCustomerDetails(id);
  }

  @Get(':id/balances')
  async getCustomerBalances(@Param('id') id: string) {
    return this.customerService.getCustomerBalances(id);
  }

  @Get(':id/check-credit')
  async checkCredit(
    @Param('id') id: string,
    @Query('amount') amount: string,
  ) {
    const parsedAmount = parseFloat(amount);
    const orderAmount = isNaN(parsedAmount) ? 0 : parsedAmount;
    return this.customerService.checkCreditEligibility(id, orderAmount);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'ACTIVE' | 'BLOCKED' | 'SUSPENDED',
  ) {
    return this.customerService.updateCustomerStatus(id, status);
  }
}
