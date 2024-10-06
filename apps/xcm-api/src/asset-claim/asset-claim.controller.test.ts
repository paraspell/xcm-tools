import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssetClaimController } from './asset-claim.controller.js';
import { type AssetClaimService } from './asset-claim.service.js';
import { type AnalyticsService } from '../analytics/analytics.service.js';
import { EventName } from '../analytics/EventName.js';
import { type AssetClaimDto } from './dto/asset-claim.dto.js';
import { type RequestWithUser } from '../types/types.js';
import { type TTransferReturn } from '@paraspell/sdk';

describe('AssetClaimController', () => {
  let controller: AssetClaimController;
  let assetClaimService: AssetClaimService;
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    assetClaimService = {
      claimAssets: vi.fn(),
    } as unknown as AssetClaimService;

    analyticsService = {
      track: vi.fn(),
    } as unknown as AnalyticsService;

    controller = new AssetClaimController(assetClaimService, analyticsService);
  });

  describe('claimAssets', () => {
    it('should call trackAnalytics and claimAssets with correct parameters', async () => {
      const bodyParams = {
        from: 'address1',
        fungible: [{ id: 'asset1', fun: 100 }],
      } as AssetClaimDto;

      const req = {
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-forwarded-for': '127.0.0.1',
        },
        user: { id: '123', requestLimit: 100 },
      } as unknown as RequestWithUser;

      const spyClaimAssets = vi
        .spyOn(assetClaimService, 'claimAssets')
        .mockResolvedValue('success' as unknown as TTransferReturn);
      const spyTrack = vi.spyOn(analyticsService, 'track');

      const result = await controller.claimAssets(bodyParams, req);

      expect(spyClaimAssets).toHaveBeenCalledWith(bodyParams);

      expect(spyTrack).toHaveBeenCalledWith(EventName.CLAIM_ASSETS, req, {
        from: 'address1',
        assetLength: 1,
      });

      expect(result).toEqual('success');
    });
  });

  describe('claimAssetsHash', () => {
    it('should call trackAnalytics and claimAssets with hashEnabled set to true', async () => {
      const bodyParams: AssetClaimDto = {
        from: 'address1',
        fungible: [{ id: 'asset1', fun: 100 }],
      } as AssetClaimDto;
      const req = {
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-forwarded-for': '127.0.0.1',
        },
        user: { id: '123', requestLimit: 100 },
      } as unknown as RequestWithUser;

      const spyClaimAssets = vi
        .spyOn(assetClaimService, 'claimAssets')
        .mockResolvedValue('success' as unknown as TTransferReturn);
      const spyTrack = vi.spyOn(analyticsService, 'track');

      const result = await controller.claimAssetsHash(bodyParams, req);

      expect(spyClaimAssets).toHaveBeenCalledWith(bodyParams, true);

      expect(spyTrack).toHaveBeenCalledWith(EventName.CLAIM_ASSETS_HASH, req, {
        from: 'address1',
        assetLength: 1,
      });

      expect(result).toEqual('success');
    });
  });
});
