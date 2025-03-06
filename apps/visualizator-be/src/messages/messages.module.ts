import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Message } from './message.entity';
import { MessageResolver } from './messages.resolver';
import { MessageService } from './messages.service';

@Module({
  imports: [TypeOrmModule.forFeature([Message])],
  providers: [MessageService, MessageResolver],
  exports: [TypeOrmModule.forFeature([Message])],
})
export class MessageModule {}
