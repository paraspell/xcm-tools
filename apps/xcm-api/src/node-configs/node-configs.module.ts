import { Module } from '@nestjs/common';

import { NodeConfigsController } from './node-configs.controller.js';
import { NodeConfigsService } from './node-configs.service.js';

@Module({
  controllers: [NodeConfigsController],
  providers: [NodeConfigsService],
})
export class NodeConfigsModule {}
