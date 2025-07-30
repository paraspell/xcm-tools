import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { join } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';

import { AddressModule } from './address/address.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { AppController } from './app.controller.js';
import { AssetClaimModule } from './asset-claim/asset-claim.module.js';
import { AssetsModule } from './assets/assets.module.js';
import { AuthGuard } from './auth/auth.guard.js';
import { AuthModule } from './auth/auth.module.js';
import { BalanceModule } from './balance/balance.module.js';
import { throttlerConfig } from './config/throttler.config.js';
import { HealthModule } from './health/health.module.js';
import { ChainConfigsModule } from './chain-configs/chain-configs.module.js';
import { PalletsModule } from './pallets/pallets.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RouterModule } from './router/router.module.js';
import { UsersService } from './users/users.service.js';
import { XTransferModule } from './x-transfer/x-transfer.module.js';
import { XcmAnalyserModule } from './xcm-analyser/xcm-analyser.module.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

@Module({
  imports: [
    AnalyticsModule,
    XTransferModule,
    AssetClaimModule,
    XcmAnalyserModule,
    RouterModule,
    AssetsModule,
    PalletsModule,
    BalanceModule,
    AddressModule,
    ChainConfigsModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService, UsersService],
      useFactory: throttlerConfig,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
      serveRoot: '/app',
    }),
    SentryModule.forRoot(),
    HealthModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
