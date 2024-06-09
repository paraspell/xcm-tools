import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { MessageService } from './messages.service';
import { Message } from './message.entity';
import { AccountXcmCountType } from './models/account-msg-count.model';
import { AssetCount } from './models/asset-count.model';
import { MessageCountByDay } from './models/message-count-by-day.model';
import { MessageCountByStatus } from './models/message-count-by-status.model';
import { CountOption, MessageCount } from './models/message-count.model';

@Resolver(() => Message)
export class MessageResolver {
  constructor(private readonly messageService: MessageService) {}

  @Query(() => [Message], { name: 'messages' })
  findAll() {
    return this.messageService.findAll();
  }

  @Query(() => Message, { name: 'message' })
  findOne(@Args('message_hash', { type: () => String }) message_hash: string) {
    return this.messageService.findOne(message_hash);
  }

  @Query(() => [MessageCountByStatus])
  async messageCounts(
    @Args('paraIds', { type: () => [Int], nullable: true }) paraIds: number[],
    @Args('startTime', { type: () => Date }) startTime: Date,
    @Args('endTime', { type: () => Date }) endTime: Date,
  ): Promise<MessageCountByStatus[]> {
    return this.messageService.countMessagesByStatus(
      paraIds,
      startTime.getTime(),
      endTime.getTime(),
    );
  }

  @Query(() => [MessageCountByDay])
  async messageCountsByDay(
    @Args('paraIds', { type: () => [Int], nullable: true }) paraIds: number[],
    @Args('startTime', { type: () => Date }) startTime: Date,
    @Args('endTime', { type: () => Date }) endTime: Date,
  ) {
    const data = await this.messageService.countMessagesByDay(
      paraIds,
      startTime.getTime(),
      endTime.getTime(),
    );

    return data;
  }

  @Query(() => [AssetCount])
  async assetCountsBySymbol(
    @Args('paraIds', { type: () => [Int], nullable: true }) paraIds: number[],
    @Args('startTime', { type: () => Date }) startTime: Date,
    @Args('endTime', { type: () => Date }) endTime: Date,
  ) {
    return this.messageService.countAssetsBySymbol(
      paraIds,
      startTime.getTime(),
      endTime.getTime(),
    );
  }

  @Query(() => [AccountXcmCountType])
  async accountCounts(
    @Args('threshold', { type: () => Int }) threshold: number,
    @Args('paraIds', { type: () => [Int], nullable: true }) paraIds: number[],
    @Args('startTime', { type: () => Date }) startTime: Date,
    @Args('endTime', { type: () => Date }) endTime: Date,
  ) {
    return this.messageService.getAccountXcmCounts(
      paraIds,
      threshold,
      startTime.getTime(),
      endTime.getTime(),
    );
  }

  @Query(() => [MessageCount])
  async totalMessageCounts(
    @Args('startTime', { type: () => Date }) startTime: Date,
    @Args('endTime', { type: () => Date }) endTime: Date,
    @Args('countBy', {
      type: () => CountOption,
      defaultValue: CountOption.ORIGIN,
    })
    countBy: CountOption,
  ): Promise<MessageCount[]> {
    const data = await this.messageService.getTotalMessageCounts(
      startTime.getTime(),
      endTime.getTime(),
      countBy,
    );
    console.log(data);

    return data;
  }
}
