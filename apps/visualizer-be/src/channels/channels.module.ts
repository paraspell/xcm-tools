import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Channel } from './channel.entity.js';
import { ChannelResolver } from './channels.resolver.js';
import { ChannelService } from './channels.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Channel])],
  providers: [ChannelService, ChannelResolver],
})
export class ChannelModule {}
