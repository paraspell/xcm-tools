import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageService } from './messages.service';
import { Message } from './message.entity';
import { MessageResolver } from './messages.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Message])],
  providers: [MessageService, MessageResolver],
  exports: [TypeOrmModule.forFeature([Message])],
})
export class MessageModule {}
