import { vi, describe, beforeEach, it, expect } from 'vitest';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NODES_WITH_RELAY_CHAINS, type TNode } from '@paraspell/sdk';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { mockRequestObject } from '../testUtils.js';
import { NodeConfigsController } from './node-configs.controller.js';
import { NodeConfigsService } from './node-configs.service.js';

describe('AssetsController', () => {
  let controller: NodeConfigsController;
  let service: NodeConfigsService;
  const node: TNode = 'Acala';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NodeConfigsController],
      providers: [
        NodeConfigsService,
        {
          provide: AnalyticsService,
          useValue: { get: () => '', track: vi.fn() },
        },
      ],
    }).compile();

    controller = module.get<NodeConfigsController>(NodeConfigsController);
    service = module.get<NodeConfigsService>(NodeConfigsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNodeNames', () => {
    it('should return the list of node names', () => {
      const mockResult = NODES_WITH_RELAY_CHAINS;
      const spy = vi.spyOn(service, 'getNodeNames').mockReturnValue(mockResult);

      const result = controller.getNodeNames(mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getSupportedAssets', () => {
    it('should return supported assets for a valid node origin and destination', () => {
      const mockResult = ['wss://acala.com', 'wss://acala2.com'];
      const spy = vi
        .spyOn(service, 'getWsEndpoints')
        .mockReturnValue(mockResult);

      const result = controller.getWsEndpoints(node, mockRequestObject);

      expect(result).toBe(mockResult);
      expect(spy).toHaveBeenCalledWith(node);
    });
  });
});
