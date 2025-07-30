import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Request,
} from '@nestjs/common';

import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import { AssetsService } from './assets.service.js';
import {
  AssetLocationDto,
  AssetLocationDtoSchema,
} from './dto/AssetLocationDto.js';
import {
  OriginFeeDetailsDto,
  OriginFeeDetailsDtoSchema,
} from './dto/OriginFeeDetailsDto.js';
import { SupportedAssetsDto } from './dto/SupportedAssetsDto.js';
import {
  SupportedDestinationsDto,
  SupportedDestinationsSchema,
} from './dto/SupportedDestinationsDto.js';
import { SymbolDto } from './dto/SymbolDto.js';

@Controller()
export class AssetsController {
  constructor(
    private assetsService: AssetsService,
    private analyticsService: AnalyticsService,
  ) {}

  @Get('assets/:chain')
  getAssetsObject(@Param('chain') chain: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_ASSETS_OBJECT, req, {
      chain,
    });
    return this.assetsService.getAssetsObject(chain);
  }

  @Get('assets/:chain/id')
  getAssetId(
    @Param('chain') chain: string,
    @Query() { symbol }: SymbolDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_ASSET_ID, req, {
      chain,
      symbol,
    });
    return this.assetsService.getAssetId(chain, symbol);
  }

  @Post('assets/:chain/location')
  getAssetLocation(
    @Param('chain') chain: string,
    @Body(new ZodValidationPipe(AssetLocationDtoSchema))
    params: AssetLocationDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_ASSET_LOCATION, req, {
      chain,
    });
    return this.assetsService.getAssetLocation(chain, params);
  }

  @Get('assets/:chain/relay-chain-symbol')
  getRelayChainSymbol(@Param('chain') chain: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_RELAYCHAIN_SYMBOL, req, {
      chain,
    });
    return this.assetsService.getRelayChainSymbol(chain);
  }

  @Get('assets/:chain/native')
  getNativeAssets(@Param('chain') chain: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_NATIVE_ASSETS, req, {
      chain,
    });
    return this.assetsService.getNativeAssets(chain);
  }

  @Get('assets/:chain/other')
  getOtherAssets(@Param('chain') chain: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_OTHER_ASSETS, req, {
      chain,
    });
    return this.assetsService.getOtherAssets(chain);
  }

  @Get('assets/:chain/all-symbols')
  getAllAssetsSymbol(@Param('chain') chain: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_ALL_ASSETS_SYMBOLS, req, {
      chain,
    });
    return this.assetsService.getAllAssetsSymbols(chain);
  }

  @Get('assets/:chain/decimals')
  getDecimals(
    @Param('chain') chain: string,
    @Query() { symbol }: SymbolDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_DECIMALS, req, {
      chain,
      symbol,
    });
    return this.assetsService.getDecimals(chain, symbol);
  }

  @Get('assets/:chain/has-support')
  hasSupportForAsset(
    @Param('chain') chain: string,
    @Query() { symbol }: SymbolDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.HAS_SUPPORT_FOR_ASSET, req, {
      chain,
      symbol,
    });
    return this.assetsService.hasSupportForAsset(chain, symbol);
  }

  @Get('supported-assets')
  getSupportedAssets(
    @Query() { origin, destination }: SupportedAssetsDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_SUPPORTED_ASSETS, req, {
      origin,
    });
    return this.assetsService.getSupportedAssets(origin, destination);
  }

  @Post('assets/:chain/supported-destinations')
  getSupportedDestinations(
    @Param('chain') chain: string,
    @Body(new ZodValidationPipe(SupportedDestinationsSchema))
    params: SupportedDestinationsDto,
    @Req() req: Request,
  ) {
    const { currency } = params;
    this.analyticsService.track(EventName.GET_SUPPORTED_DESTINATIONS, req, {
      chain,
      currency: JSON.stringify(currency),
    });
    return this.assetsService.getSupportedDestinations(chain, params);
  }

  @Post('origin-fee-details')
  getOriginFeeDetails(
    @Body(new ZodValidationPipe(OriginFeeDetailsDtoSchema))
    params: OriginFeeDetailsDto,
    @Req() req: Request,
  ) {
    const { origin, destination, currency } = params;
    this.analyticsService.track(EventName.GET_ORIGIN_FEE_DETAILS, req, {
      origin,
      destination,
      currency: JSON.stringify(currency),
    });
    return this.assetsService.getOriginFeeDetails(params);
  }

  @Get('assets/:chain/fee-assets')
  getFeeAssets(@Param('chain') chain: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_FEE_ASSETS, req, {
      chain,
    });
    return this.assetsService.getFeeAssets(chain);
  }
}
