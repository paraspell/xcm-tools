import { Body, Controller, Post, Req, Request, UsePipes } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import { AssetClaimService } from './asset-claim.service.js';
import { AssetClaimDto, AssetClaimSchema } from './dto/asset-claim.dto.js';

@Controller()
export class AssetClaimController {
  constructor(
    private xTransferService: AssetClaimService,
    private analyticsService: AnalyticsService,
  ) {}

  private trackAnalytics(
    eventName: EventName,
    req: Request,
    params: AssetClaimDto,
  ) {
    const { from, fungible } = params;
    this.analyticsService.track(eventName, req, {
      from: from || 'unknown',
      assetLength: fungible.length,
    });
  }

  @Post('asset-claim')
  @UsePipes(new ZodValidationPipe(AssetClaimSchema))
  claimAssets(@Body() bodyParams: AssetClaimDto, @Req() req: Request) {
    this.trackAnalytics(EventName.CLAIM_ASSETS, req, bodyParams);
    return this.xTransferService.claimAssets(bodyParams);
  }

  @Post('asset-claim-hash')
  @UsePipes(new ZodValidationPipe(AssetClaimSchema))
  claimAssetsHash(@Body() bodyParams: AssetClaimDto, @Req() req: Request) {
    this.trackAnalytics(EventName.CLAIM_ASSETS_HASH, req, bodyParams);
    return this.xTransferService.claimAssets(bodyParams, true);
  }
}
