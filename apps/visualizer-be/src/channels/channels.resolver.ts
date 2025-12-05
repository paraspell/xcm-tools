import { Args, Int, Query, Resolver } from '@nestjs/graphql';

import { Channel } from './channel.entity.js';
import { ChannelService } from './channels.service.js';

@Resolver(() => Channel)
export class ChannelResolver {
  constructor(private readonly channelService: ChannelService) {}

  @Query(() => [Channel], { name: 'channels' })
  findAll(@Args('ecosystem', { type: () => String }) ecosystem: string) {
    return this.channelService.findAll(ecosystem);
  }

  @Query(() => [Channel], { name: 'channelsInInterval' })
  findAllInterval(
    @Args('ecosystem', { type: () => String }) ecosystem: string,
    @Args('startTime', { type: () => Date }) startTime: Date,
    @Args('endTime', { type: () => Date }) endTime: Date,
  ) {
    return this.channelService.findAllInInterval(
      ecosystem,
      startTime.getTime(),
      endTime.getTime(),
    );
  }

  @Query(() => Channel, { name: 'channel' })
  findOne(
    @Args('ecosystem', { type: () => String }) ecosystem: string,
    @Args('sender', { type: () => Int }) sender: number,
    @Args('recipient', { type: () => Int }) recipient: number,
  ) {
    return this.channelService.findOne(ecosystem, sender, recipient);
  }
}
