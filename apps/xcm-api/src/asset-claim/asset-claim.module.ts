import { Module } from '@nestjs/common';
import { AssetClaimController } from './asset-claim.controller.js';
import { AssetClaimService } from './asset-claim.service.js';

@Module({
  controllers: [AssetClaimController],
  providers: [AssetClaimService],
})
export class AssetClaimModule {}
