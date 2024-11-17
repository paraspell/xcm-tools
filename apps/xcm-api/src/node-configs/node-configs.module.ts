import { Module } from '@nestjs/common';
import { NodeConfigsService } from './node-configs.service.js';
import { NodeConfigsController } from './node-configs.controller.js';

@Module({
  controllers: [NodeConfigsController],
  providers: [NodeConfigsService],
})
export class NodeConfigsModule {}
