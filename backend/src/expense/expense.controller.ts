import { Controller, Get, Post, Param, Body, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { ExpenseService } from './expense.service';
import { CreateExpenseClaimDto } from './dto/create-expense-claim.dto';
import { ApproveExpenseDto } from './dto/approve-expense.dto';

@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createExpenseClaim(@Body() dto: CreateExpenseClaimDto) {
    return this.expenseService.createExpenseClaim(dto);
  }

  @Patch(':id/approve')
  async approveExpenseClaim(@Param('id') id: string, @Body() dto: ApproveExpenseDto) {
    return this.expenseService.approveExpenseClaim(id, dto);
  }

  @Get('shift/:shiftSessionId')
  async getExpenseClaimsByShift(@Param('shiftSessionId') shiftSessionId: string) {
    return this.expenseService.getExpenseClaimsByShift(shiftSessionId);
  }

  @Get('tenant/:tenantId')
  async getExpenseClaimsByTenant(@Param('tenantId') tenantId: string) {
    return this.expenseService.getExpenseClaimsByTenant(tenantId);
  }
}
