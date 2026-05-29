import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { LedgerModule } from './ledger/ledger.module';
import { CustomerModule } from './customer/customer.module';
import { OrderModule } from './order/order.module';
import { ShiftModule } from './shift/shift.module';
import { ExpenseModule } from './expense/expense.module';
import { StaffModule } from './staff/staff.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';


@Module({
  imports: [
    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '..', 'public-simulator'),
        serveRoot: '/simulator',
      },
      {
        rootPath: join(__dirname, '..', 'public'),
        exclude: ['/api*', '/simulator*'],
      },
    ),
    PrismaModule,
    AuthModule,
    LedgerModule,
    CustomerModule,
    OrderModule,
    ShiftModule,
    ExpenseModule,
    StaffModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

