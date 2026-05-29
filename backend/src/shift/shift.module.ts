import { Module } from '@nestjs/common';
import { ShiftService } from './shift.service';
import { ShiftController } from './shift.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [PrismaModule, LedgerModule],
  providers: [ShiftService],
  controllers: [ShiftController],
  exports: [ShiftService],
})
export class ShiftModule {}
