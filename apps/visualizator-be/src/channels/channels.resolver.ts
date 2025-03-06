import { Args, Int, Query, Resolver } from '@nestjs/graphql';

import { Channel } from './channel.entity';
import { ChannelService } from './channels.service';

@Resolver(() => Channel)
export class ChannelResolver {
  constructor(private readonly channelService: ChannelService) {}

  @Query(() => [Channel], { name: 'channels' })
  findAll(
    @Args('startTime', { type: () => Date }) startTime: Date,
    @Args('endTime', { type: () => Date }) endTime: Date,
  ) {
    return this.channelService.findAll(startTime.getTime(), endTime.getTime());
  }

  @Query(() => Channel, { name: 'channel' })
  findOne(
    @Args('sender', { type: () => Int }) sender: number,
    @Args('recipient', { type: () => Int }) recipient: number,
  ) {
    return this.channelService.findOne(sender, recipient);
  }
}
