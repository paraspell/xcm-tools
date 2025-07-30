import { Module } from '@nestjs/common';

import { ChainConfigsController } from './chain-configs.controller.js';
import { ChainConfigsService } from './chain-configs.service.js';

@Module({
  controllers: [ChainConfigsController],
  providers: [ChainConfigsService],
})
export class ChainConfigsModule {}
