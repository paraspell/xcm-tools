import { Controller, Post, Delete, Query, Req, Request } from '@nestjs/common';
import { ChannelsService } from './channels.service.js';
import { OpenChannelDto } from './dto/open-channel.dto.js';
import { CloseChannelDto } from './dto/close-channel.dto.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';

@Controller('hrmp/channels')
export class ChannelsController {
  constructor(
    private channelsService: ChannelsService,
    private analyticsService: AnalyticsService,
  ) {}

  @Post()
  openChannel(@Query() openChannelDto: OpenChannelDto, @Req() req: Request) {
    const { ...properties } = openChannelDto;
    this.analyticsService.track(EventName.OPEN_CHANNEL, req, properties);
    return this.channelsService.openChannel(openChannelDto);
  }

  @Delete()
  closeChannel(@Query() closeChannelDto: CloseChannelDto, @Req() req: Request) {
    const { ...properties } = closeChannelDto;
    this.analyticsService.track(EventName.CLOSE_CHANNEL, req, properties);
    return this.channelsService.closeChannel(closeChannelDto);
  }
}
