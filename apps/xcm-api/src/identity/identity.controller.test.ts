import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import type { RequestWithUser } from '../types/types.js';
import type { CreateIdentityDto } from './dto/identity.dto.js';
import { IdentityController } from './identity.controller.js';
import type { IdentityService } from './identity.service.js';

describe('IdentityController', () => {
  let controller: IdentityController;
  let identityService: IdentityService;
  let analyticsService: AnalyticsService;

  const bodyParams = {
    from: 'node',
    regIndex: '0',
    maxRegistrarFee: '0',
  } as CreateIdentityDto;

  beforeEach(() => {
    identityService = {
      createIdentityCall: vi.fn(),
    } as unknown as IdentityService;

    analyticsService = {
      track: vi.fn(),
    } as unknown as AnalyticsService;

    controller = new IdentityController(identityService, analyticsService);
  });

  it('should call trackAnalytics and createIdentityCall', async () => {
    const req = {
      headers: {
        'user-agent': 'Mozilla/5.0',
        'x-forwarded-for': '127.0.0.1',
      },
      user: { id: '123', requestLimit: 100 },
    } as unknown as RequestWithUser;

    const spyCreateIdentity = vi
      .spyOn(identityService, 'createIdentityCall')
      .mockResolvedValue('success');
    const spyTrack = vi.spyOn(analyticsService, 'track');

    const result = await controller.createIdentityCall(bodyParams, req);

    expect(spyCreateIdentity).toHaveBeenCalledWith(bodyParams);

    expect(spyTrack).toHaveBeenCalledWith(EventName.CREATE_IDENTITY, req, {
      from: 'node',
      regIndex: '0',
      maxRegistrarFee: '0',
    });

    expect(result).toEqual('success');
  });
});
