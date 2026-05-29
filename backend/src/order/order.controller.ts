import { Controller, Get, Post, Param, Body, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AssignOrderDto } from './dto/assign-order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(dto);
  }

  @Get('tenant/:tenantId')
  async getOrdersByTenant(@Param('tenantId') tenantId: string) {
    return this.orderService.getOrdersByTenant(tenantId);
  }

  @Get('warehouses/tenant/:tenantId')
  async getWarehousesByTenant(@Param('tenantId') tenantId: string) {
    return this.orderService.getWarehousesByTenant(tenantId);
  }

  @Get(':id')
  async getOrderDetails(@Param('id') id: string) {
    return this.orderService.getOrderDetails(id);
  }

  @Patch(':id/assign')
  async assignOrder(@Param('id') id: string, @Body() dto: AssignOrderDto) {
    return this.orderService.assignOrder(id, dto);
  }

  @Patch(':id/dispatch')
  async dispatchOrder(@Param('id') id: string) {
    return this.orderService.dispatchOrder(id);
  }

  @Patch('warehouses/:warehouseId/stock')
  async updateWarehouseStock(
    @Param('warehouseId') warehouseId: string,
    @Body() dto: { tenantId: string; fullChange: number; emptyChange: number; damagedChange: number },
  ) {
    return this.orderService.updateWarehouseStock(warehouseId, dto.tenantId, {
      fullChange: dto.fullChange,
      emptyChange: dto.emptyChange,
      damagedChange: dto.damagedChange,
    });
  }
}
