import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { XTransferModule } from './x-transfer/x-transfer.module.js';
import { AssetsModule } from './assets/assets.module.js';
import { PalletsModule } from './pallets/pallets.module.js';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { AuthGuard } from './auth/auth.guard.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users/users.service.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { typeOrmConfig } from './config/typeorm.config.js';
import { throttlerConfig } from './config/throttler.config.js';
import { RouterModule } from './router/router.module.js';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { fileURLToPath } from 'url';
import path from 'path';
import { AssetClaimModule } from './asset-claim/asset-claim.module.js';
import { TransferInfoModule } from './transfer-info/transfer-info.module.js';
import { XcmAnalyserModule } from './xcm-analyser/xcm-analyser.module.js';
import { XTransferEthModule } from './x-transfer-eth/x-transfer-eth.module.js';
import { BalanceModule } from './balance/balance.module.js';
import { NodeConfigsModule } from './node-configs/node-configs.module.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

@Module({
  imports: [
    AnalyticsModule,
    XTransferModule,
    XTransferEthModule,
    AssetClaimModule,
    TransferInfoModule,
    XcmAnalyserModule,
    RouterModule,
    AssetsModule,
    PalletsModule,
    BalanceModule,
    NodeConfigsModule,
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService, UsersService],
      useFactory: throttlerConfig,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
      serveRoot: '/app',
    }),
    SentryModule.forRoot(),
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
