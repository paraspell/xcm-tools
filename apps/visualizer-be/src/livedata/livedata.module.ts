import { Module } from '@nestjs/common';

import { LiveDataGateway } from './livedata.gateway';
import { SubscanClient } from './subscan.client';

@Module({
  providers: [LiveDataGateway, SubscanClient],
  exports: [LiveDataGateway, SubscanClient],
})
export class LiveDataModule {}
