import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { ChannelService } from './channels.service';
import { Channel } from './channel.entity';

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
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.channelService.findOne(id);
  }
}
