// Register ParaSpell extensions
import '@paraspell/evm';
import '@paraspell/evm-snowbridge';

import { Module } from '@nestjs/common';

import { XTransferController } from './x-transfer.controller.js';
import { XTransferService } from './x-transfer.service.js';

@Module({
  controllers: [XTransferController],
  providers: [XTransferService],
})
export class XTransferModule {}
