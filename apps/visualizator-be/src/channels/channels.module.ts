import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelService } from './channels.service';
import { ChannelResolver } from './channels.resolver';
import { Channel } from './channel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Channel])],
  providers: [ChannelService, ChannelResolver],
})
export class ChannelModule {}
