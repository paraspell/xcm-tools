import { Module } from '@nestjs/common';

import { AssetsController } from './assets.controller.js';
import { AssetsService } from './assets.service.js';

@Module({
  controllers: [AssetsController],
  providers: [AssetsService],
})
export class AssetsModule {}
