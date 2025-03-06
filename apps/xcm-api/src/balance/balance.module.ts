import { Module } from '@nestjs/common';

import { BalanceController } from './balance.controller.js';
import { BalanceService } from './balance.service.js';

@Module({
  controllers: [BalanceController],
  providers: [BalanceService],
})
export class BalanceModule {}
