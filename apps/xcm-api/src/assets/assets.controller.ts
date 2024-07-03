import { Controller, Get, Param, Query, Req, Request } from '@nestjs/common';
import { AssetsService } from './assets.service.js';
import { isNumeric } from '../utils.js';
import { SymbolDto } from './dto/SymbolDto.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';

@Controller('assets')
export class AssetsController {
  constructor(
    private assetsService: AssetsService,
    private analyticsService: AnalyticsService,
  ) {}

  @Get()
  getNodeNames(@Req() req: Request) {
    this.analyticsService.track(EventName.GET_NODE_NAMES, req);
    return this.assetsService.getNodeNames();
  }

  @Get(':node')
  getAssetsObject(@Param('node') nodeOrParaId: string, @Req() req: Request) {
    const isParaId = isNumeric(nodeOrParaId);
    if (isParaId) {
      this.analyticsService.track(EventName.GET_NODE_BY_PARA_ID, req, {
        paraId: nodeOrParaId,
      });
      return this.assetsService.getNodeByParaId(Number(nodeOrParaId));
    }
    this.analyticsService.track(EventName.GET_ASSETS_OBJECT, req, {
      node: nodeOrParaId,
    });
    return this.assetsService.getAssetsObject(nodeOrParaId);
  }

  @Get(':node/id')
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

  @Get(':node/relay-chain-symbol')
  getRelayChainSymbol(@Param('node') node: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_RELAYCHAIN_SYMBOL, req, {
      node,
    });
    return this.assetsService.getRelayChainSymbol(node);
  }

  @Get(':node/native')
  getNativeAssets(@Param('node') node: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_NATIVE_ASSETS, req, {
      node,
    });
    return this.assetsService.getNativeAssets(node);
  }

  @Get(':node/other')
  getOtherAssets(@Param('node') node: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_OTHER_ASSETS, req, {
      node,
    });
    return this.assetsService.getOtherAssets(node);
  }

  @Get(':node/all-symbols')
  getAllAssetsSymbol(@Param('node') node: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_ALL_ASSETS_SYMBOLS, req, {
      node,
    });
    return this.assetsService.getAllAssetsSymbols(node);
  }

  @Get(':node/decimals')
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

  @Get(':node/has-support')
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

  @Get(':node/para-id')
  getParaId(@Param('node') node: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_PARA_ID, req, {
      node,
    });
    return this.assetsService.getParaId(node);
  }
}
