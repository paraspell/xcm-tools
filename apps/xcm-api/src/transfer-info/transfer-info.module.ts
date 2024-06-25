import { Module } from '@nestjs/common';
import { TransferInfoController } from './transfer-info.controller.js';
import { TransferInfoService } from './transfer-info.service.js';

@Module({
  controllers: [TransferInfoController],
  providers: [TransferInfoService],
})
export class TransferInfoModule {}
