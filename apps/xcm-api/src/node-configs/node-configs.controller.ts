import { Controller, Get, Param, Req, Request } from '@nestjs/common';
import { NodeConfigsService } from './node-configs.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';

@Controller()
export class NodeConfigsController {
  constructor(
    private service: NodeConfigsService,
    private analyticsService: AnalyticsService,
  ) {}

  @Get('nodes')
  getNodeNames(@Req() req: Request) {
    this.analyticsService.track(EventName.GET_NODE_NAMES, req);
    return this.service.getNodeNames();
  }

  @Get('ws-endpoints/:node')
  getWsEndpoints(@Param('node') node: string, @Req() req: Request) {
    this.analyticsService.track(EventName.GET_NODE_NAMES, req);
    return this.service.getWsEndpoints(node);
  }
}
