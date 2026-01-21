import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';

import { ChannelModule } from '../channels/channels.module.js';
import { LiveDataModule } from '../livedata/livedata.module.js';
import { MessageModule } from '../messages/messages.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      buildSchemaOptions: {
        dateScalarMode: 'timestamp',
      },
    }),
    MessageModule,
    ChannelModule,
    LiveDataModule,
  ],
})
export class AppModule {}
