import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [PrismaModule, CustomerModule],
  providers: [OrderService],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
