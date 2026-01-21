import { Module } from '@nestjs/common';

import { ChannelResolver } from './channels.resolver.js';
import { ChannelService } from './channels.service.js';

@Module({
  providers: [ChannelService, ChannelResolver],
})
export class ChannelModule {}
