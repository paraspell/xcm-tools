import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Channel } from './channel.entity';
import { ChannelResolver } from './channels.resolver';
import { ChannelService } from './channels.service';

@Module({
  imports: [TypeOrmModule.forFeature([Channel])],
  providers: [ChannelService, ChannelResolver],
})
export class ChannelModule {}
