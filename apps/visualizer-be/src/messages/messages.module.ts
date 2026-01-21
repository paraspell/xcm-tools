import { Module } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { MessageResolver } from './messages.resolver.js';
import { MessageService } from './messages.service.js';

@Module({
  providers: [MessageService, MessageResolver, PrismaService],
  exports: [MessageService],
})
export class MessageModule {}
