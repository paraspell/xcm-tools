import { ConfigService } from '@nestjs/config';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as Mixpanel from 'mixpanel';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RequestWithUser } from '../types/types.js';
import { AnalyticsService } from './analytics.service.js';
import { EventName } from './EventName.js';

vi.mock('mixpanel', () => ({
  init: vi.fn().mockReturnValue({
    track: vi.fn(),
    people: { set: vi.fn() },
  }),
}));

vi.mock('ua-parser-js', () => ({
  UAParser: function () {
    return {
      browser: { name: 'Chrome', version: '93' },
      device: { vendor: 'Apple', model: 'iPhone', type: 'mobile' },
      os: { name: 'iOS', version: '14' },
    };
  },
}));

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockMixpanel: Mixpanel.Mixpanel;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn(() => 'fake_token'),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);

    mockMixpanel = Mixpanel.init('fake_token', { host: 'api-eu.mixpanel.com' });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('tracks an event correctly', () => {
    const req = {
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-forwarded-for': '192.168.1.1',
      },
      user: {
        id: '123',
      },
    } as unknown as RequestWithUser;
    const eventName = EventName.CLAIM_ASSETS;
    const properties = { additional: 'info' };

    const spy = vi.spyOn(mockMixpanel, 'track');

    service.track(eventName, req, properties);

    expect(spy).toHaveBeenCalledWith(
      eventName,
      expect.objectContaining({
        ...properties,
        distinct_id: '123',
        ip: '192.168.1.1',
        $browser: { name: 'Chrome', version: '93' },
        $device: { vendor: 'Apple', model: 'iPhone', type: 'mobile' },
        $os: { name: 'iOS', version: '14' },
      }),
    );
  });

  it('tracks an event correctly without user', () => {
    const req = {
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-forwarded-for': '192.168.1.1',
      },
    } as unknown as RequestWithUser;
    const eventName = EventName.CLAIM_ASSETS;
    const properties = { additional: 'info' };

    const spy = vi.spyOn(mockMixpanel, 'track');

    service.track(eventName, req, properties);

    expect(spy).toHaveBeenCalledWith(
      eventName,
      expect.objectContaining({
        ...properties,
        ip: '192.168.1.1',
        $browser: { name: 'Chrome', version: '93' },
        $device: { vendor: 'Apple', model: 'iPhone', type: 'mobile' },
        $os: { name: 'iOS', version: '14' },
      }),
    );
  });

  it('should call Mixpanel people.set with correct parameters when client is initialized', () => {
    const userId = 'user123';
    const properties = { email: 'user@example.com', age: 30 };

    const spy = vi.spyOn(mockMixpanel.people, 'set');

    service.identify(userId, properties);

    expect(spy).toHaveBeenCalledWith(userId, properties);
  });
});
