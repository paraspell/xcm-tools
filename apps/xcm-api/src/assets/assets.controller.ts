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
import { AssetsService } from './assets.service.js';
import { SymbolDto } from './dto/SymbolDto.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { SupportedAssetsDto } from './dto/SupportedAssetsDto.js';
import {
  OriginFeeDetailsDto,
  OriginFeeDetailsDtoSchema,
} from './dto/OriginFeeDetailsDto.js';
import { ZodValidationPipe } from '../zod-validation-pipe.js';
import {
  AssetMultiLocationDto,
  AssetMultiLocationDtoSchema,
} from './dto/AssetMultiLocationDto.js';

@Controller()
export class AssetsController {
  constructor(
    private assetsService: AssetsService,
    private analyticsService: AnalyticsService,
  ) {}

  @Get('assets/:node')
  getAssetsObject(@Param('node') node: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_ASSETS_OBJECT, req, {
      node,
    });
    return this.assetsService.getAssetsObject(node);
  }

  @Get('assets/:node/id')
  getAssetId(
    @Param('node') node: string,
    @Query() { symbol }: SymbolDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_ASSET_ID, req, {
      node,
      symbol,
    });
    return this.assetsService.getAssetId(node, symbol);
  }

  @Post('assets/:node/multilocation')
  getAssetMultiLocation(
    @Param('node') node: string,
    @Body(new ZodValidationPipe(AssetMultiLocationDtoSchema))
    params: AssetMultiLocationDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_ASSET_MULTILOCATION, req, {
      node,
    });
    return this.assetsService.getAssetMultiLocation(node, params);
  }

  @Get('assets/:node/relay-chain-symbol')
  getRelayChainSymbol(@Param('node') node: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_RELAYCHAIN_SYMBOL, req, {
      node,
    });
    return this.assetsService.getRelayChainSymbol(node);
  }

  @Get('assets/:node/native')
  getNativeAssets(@Param('node') node: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_NATIVE_ASSETS, req, {
      node,
    });
    return this.assetsService.getNativeAssets(node);
  }

  @Get('assets/:node/other')
  getOtherAssets(@Param('node') node: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_OTHER_ASSETS, req, {
      node,
    });
    return this.assetsService.getOtherAssets(node);
  }

  @Get('assets/:node/all-symbols')
  getAllAssetsSymbol(@Param('node') node: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_ALL_ASSETS_SYMBOLS, req, {
      node,
    });
    return this.assetsService.getAllAssetsSymbols(node);
  }

  @Get('assets/:node/decimals')
  getDecimals(
    @Param('node') node: string,
    @Query() { symbol }: SymbolDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_DECIMALS, req, {
      node,
      symbol,
    });
    return this.assetsService.getDecimals(node, symbol);
  }

  @Get('assets/:node/has-support')
  hasSupportForAsset(
    @Param('node') node: string,
    @Query() { symbol }: SymbolDto,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.HAS_SUPPORT_FOR_ASSET, req, {
      node,
      symbol,
    });
    return this.assetsService.hasSupportForAsset(node, symbol);
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

  @Post('origin-fee-details')
  getOriginFeeDetails(
    @Body(new ZodValidationPipe(OriginFeeDetailsDtoSchema))
    params: OriginFeeDetailsDto,
    @Req() req: Request,
  ) {
    const { origin, destination, currency } = params;
    this.analyticsService.track(EventName.GET_SUPPORTED_ASSETS, req, {
      origin,
      destination,
      currency: JSON.stringify(currency),
    });
    return this.assetsService.getOriginFeeDetails(params);
  }
}
