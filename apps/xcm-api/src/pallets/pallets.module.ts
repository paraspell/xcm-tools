import { Module } from '@nestjs/common';
import { PalletsService } from './pallets.service.js';
import { PalletsController } from './pallets.controller.js';

@Module({
  controllers: [PalletsController],
  providers: [PalletsService],
})
export class PalletsModule {}
