import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Mixpanel from 'mixpanel';
import { UAParser } from 'ua-parser-js';

import { RequestWithUser } from '../types/types.js';
import { EventName } from './EventName.js';

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
    req: RequestWithUser,
    properties?: Record<string, string | number>,
  ) {
    if (!this.client) return;
    const user = req.user;
    const { browser, device, os } = UAParser(
      req.headers['user-agent'] as string,
    );
    this.client.track(eventName, {
      ...properties,
      ...(user && { distinct_id: user.id }),
      ip: req.headers['x-forwarded-for'] as string,
      $browser: browser,
      $device: device,
      $os: os,
    });
  }

  identify(userId: string, properties: Record<string, string | number | null>) {
    if (!this.client) return;
    this.client.people.set(userId, properties);
  }
}
