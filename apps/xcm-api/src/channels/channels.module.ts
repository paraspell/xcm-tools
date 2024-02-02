import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service.js';
import { ChannelsController } from './channels.controller.js';

@Module({
  controllers: [ChannelsController],
  providers: [ChannelsService],
})
export class ChannelsModule {}
