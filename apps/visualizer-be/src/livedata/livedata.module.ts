import { Module } from '@nestjs/common';

import { LiveDataGateway } from './livedata.gateway.js';
import { SubscanClient } from './subscan.client.js';

@Module({
  providers: [LiveDataGateway, SubscanClient],
  exports: [LiveDataGateway, SubscanClient],
})
export class LiveDataModule {}
