/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Mixpanel from 'mixpanel';
import { EventName } from './EventName.js';
import UAParser from 'ua-parser-js';

@Injectable()
export class AnalyticsService {
  constructor(private configService: ConfigService) {
    this.init();
  }

  private client: Mixpanel.Mixpanel;

  init() {
    const projectToken = this.configService.get<string>(
      'MIXPANEL_PROJECT_TOKEN',
    );
    if (!projectToken) return;
    this.client = Mixpanel.init(projectToken, {
      host: 'api-eu.mixpanel.com',
    });
  }

  track(
    eventName: EventName,
    req: Request,
    properties?: Record<string, string | number>,
  ) {
    if (!this.client) return;
    const user = (req as any).user;
    const parser = new UAParser(req.headers['user-agent']);
    this.client.track(eventName, {
      ...properties,
      ...(user && { distinct_id: user.id }),
      ip: req.headers['x-forwarded-for'],
      $browser: parser.getBrowser(),
      $device: parser.getDevice(),
      $os: parser.getOS(),
    });
  }

  identify(userId: string, properties: Record<string, string | number>) {
    if (!this.client) return;
    this.client.people.set(userId, properties);
  }
}
