import { Module } from '@nestjs/common';
import { XTransferEthController } from './x-transfer-eth.controller.js';
import { XTransferEthService } from './x-transfer-eth.service.js';

@Module({
  controllers: [XTransferEthController],
  providers: [XTransferEthService],
})
export class XTransferEthModule {}
