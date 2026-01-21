import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { TSubstrateChain } from '@paraspell/sdk';

import { CountOption } from '../types.js';
import { MessageService } from './messages.service.js';
import {
  AccountXcmCountType,
  AssetCount,
  Message,
  MessageCount,
  MessageCountByDay,
  MessageCountByStatus,
} from './models/index.js';

@Resolver(() => Message)
export class MessageResolver {
  constructor(private readonly messageService: MessageService) {}

  @Query(() => [MessageCountByStatus])
  async messageCounts(
    @Args('ecosystem', { type: () => String, nullable: true })
    ecosystem: string,
    @Args('parachains', { type: () => [String] }) parachains: string[],
    @Args('startTime', { type: () => Date }) startTime: Date,
    @Args('endTime', { type: () => Date }) endTime: Date,
  ): Promise<MessageCountByStatus[]> {
    return this.messageService.countMessagesByStatus(
      ecosystem,
      parachains as TSubstrateChain[],
      startTime.getTime(),
      endTime.getTime(),
    );
  }

  @Query(() => [MessageCountByDay])
  async messageCountsByDay(
    @Args('ecosystem', { type: () => String }) ecosystem: string,
    @Args('parachains', { type: () => [String] }) parachains: string[],
    @Args('startTime', { type: () => Date }) startTime: Date,
    @Args('endTime', { type: () => Date }) endTime: Date,
  ) {
    return this.messageService.countMessagesByDay(
      ecosystem,
      parachains as TSubstrateChain[],
      startTime.getTime(),
      endTime.getTime(),
    );
  }

  @Query(() => [AssetCount])
  async assetCountsBySymbol(
    @Args('ecosystem', { type: () => String }) ecosystem: string,
    @Args('parachains', { type: () => [String] }) parachains: string[],
    @Args('startTime', { type: () => Date }) startTime: Date,
    @Args('endTime', { type: () => Date }) endTime: Date,
  ) {
    return this.messageService.countAssetsBySymbol(
      ecosystem,
      parachains as TSubstrateChain[],
      startTime.getTime(),
      endTime.getTime(),
    );
  }

  @Query(() => [AccountXcmCountType])
  async accountCounts(
    @Args('ecosystem', { type: () => String }) ecosystem: string,
    @Args('threshold', { type: () => Int }) threshold: number,
    @Args('paraIds', { type: () => [Int], nullable: true }) paraIds: number[],
    @Args('startTime', { type: () => Date }) startTime: Date,
    @Args('endTime', { type: () => Date }) endTime: Date,
  ) {
    return this.messageService.getAccountXcmCounts(
      ecosystem,
      paraIds,
      threshold,
      startTime.getTime(),
      endTime.getTime(),
    );
  }

  @Query(() => [MessageCount])
  async totalMessageCounts(
    @Args('ecosystem', { type: () => String }) ecosystem: string,
    @Args('startTime', { type: () => Date }) startTime: Date,
    @Args('endTime', { type: () => Date }) endTime: Date,
    @Args('countBy', {
      type: () => CountOption,
      defaultValue: CountOption.ORIGIN,
    })
    countBy: CountOption,
  ): Promise<MessageCount[]> {
    return this.messageService.getTotalMessageCounts(
      ecosystem,
      startTime.getTime(),
      endTime.getTime(),
      countBy,
    );
  }
}
