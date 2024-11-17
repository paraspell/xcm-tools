import { vi, describe, beforeEach, it, expect, afterEach } from 'vitest';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as paraspellSdk from '@paraspell/sdk';
import type { TNode } from '@paraspell/sdk';
import { NodeConfigsService } from './node-configs.service.js';

vi.mock('@paraspell/sdk', async () => {
  const actual = await vi.importActual('@paraspell/sdk');
  return {
    ...actual,
    getNodeProviders: vi.fn().mockImplementation(() => ['wss://acala.com']),
  };
});

describe('AssetsService', () => {
  let service: NodeConfigsService;
  const node: TNode = 'Acala';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NodeConfigsService],
    }).compile();

    service = module.get<NodeConfigsService>(NodeConfigsService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNodeNames', () => {
    it('should return the list of node names', () => {
      const result = service.getNodeNames();
      expect(result).toEqual(paraspellSdk.NODES_WITH_RELAY_CHAINS);
    });
  });

  describe('getWsEndpoints', () => {
    it('should return the list of WS endpoints for a given node', () => {
      const result = service.getWsEndpoints(node);
      expect(result).toEqual(paraspellSdk.getNodeProviders(node));
    });
  });
});
