import { Controller, Get, Param, Query, Req, Request } from '@nestjs/common';
import { NodeConfigsService } from './node-configs.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';

@Controller('nodes')
export class NodeConfigsController {
  constructor(
    private service: NodeConfigsService,
    private analyticsService: AnalyticsService,
  ) {}

  @Get()
  getNodeNames(@Req() req: Request) {
    this.analyticsService.track(EventName.GET_NODE_NAMES, req);
    return this.service.getNodeNames();
  }

  @Get(':node/ws-endpoints')
  getWsEndpoints(@Param('node') node: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_NODE_NAMES, req);
    return this.service.getWsEndpoints(node);
  }

  @Get(':node/para-id')
  getParaId(@Param('node') node: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_PARA_ID, req, {
      node,
    });
    return this.service.getParaId(node);
  }

  @Get(':paraId')
  getAssetsObject(
    @Param('paraId') paraId: string,
    @Query('ecosystem') ecosystem: string | undefined,
    @Req() req: Request,
  ) {
    this.analyticsService.track(EventName.GET_NODE_BY_PARA_ID, req, {
      paraId,
    });
    return this.service.getNodeByParaId(Number(paraId), ecosystem);
  }

  @Get(':node/has-dry-run-support')
  hasDryRunSupport(@Param('node') node: string, @Req() req: Request) {
    this.analyticsService.track(EventName.HAS_DRY_RUN_SUPPORT, req, {
      node,
    });
    return this.service.hasDryRunSupport(node);
  }
}
