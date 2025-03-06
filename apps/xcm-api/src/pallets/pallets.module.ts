import { Module } from '@nestjs/common';

import { PalletsController } from './pallets.controller.js';
import { PalletsService } from './pallets.service.js';

@Module({
  controllers: [PalletsController],
  providers: [PalletsService],
})
export class PalletsModule {}
