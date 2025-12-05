import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Message } from './message.entity.js';
import { MessageResolver } from './messages.resolver.js';
import { MessageService } from './messages.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Message])],
  providers: [MessageService, MessageResolver],
  exports: [TypeOrmModule.forFeature([Message])],
})
export class MessageModule {}
