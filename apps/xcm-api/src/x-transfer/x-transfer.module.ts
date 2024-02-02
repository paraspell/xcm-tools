import { Module } from '@nestjs/common';
import { XTransferService } from './x-transfer.service.js';
import { XTransferController } from './x-transfer.controller.js';

@Module({
  controllers: [XTransferController],
  providers: [XTransferService],
})
export class XTransferModule {}
