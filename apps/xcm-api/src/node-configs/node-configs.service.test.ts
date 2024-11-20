import type { MockInstance } from 'vitest';
import { vi, describe, beforeEach, it, expect, afterEach } from 'vitest';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as paraspellSdk from '@paraspell/sdk';
import * as utils from '../utils.js';
import type { TNode } from '@paraspell/sdk';
import { NodeConfigsService } from './node-configs.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';

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

  describe('getParaId', () => {
    const paraId = 2000;
    const invalidNode = 'InvalidNode';
    let getParaIdSpy: MockInstance;

    beforeEach(() => {
      getParaIdSpy = vi.spyOn(paraspellSdk, 'getParaId');
    });

    it('should return parachain ID for a valid node', () => {
      const result = service.getParaId(node);

      expect(result).toEqual(paraId);
      expect(getParaIdSpy).toHaveBeenCalledWith(node);
    });

    it('should throw BadRequestException for invalid node', () => {
      const validateNodeSpy = vi
        .spyOn(utils, 'validateNode')
        .mockImplementation(() => {
          throw new BadRequestException();
        });
      expect(() => service.getParaId(invalidNode)).toThrow(BadRequestException);

      expect(validateNodeSpy).toHaveBeenCalledWith(invalidNode, {
        excludeEthereum: true,
      });
      expect(getParaIdSpy).not.toHaveBeenCalled();
    });
  });

  describe('getNodeByParaId', () => {
    const paraId = 2000;
    let getTNodeSpy: MockInstance;

    beforeEach(() => {
      getTNodeSpy = vi.spyOn(paraspellSdk, 'getTNode');
    });

    it('should return node by parachain ID', () => {
      getTNodeSpy.mockReturnValue(node);
      const result = service.getNodeByParaId(paraId, 'polkadot');

      expect(result).toEqual(JSON.stringify(node));
      expect(getTNodeSpy).toHaveBeenCalledWith(paraId, 'polkadot');
    });

    it('should throw NotFoundException for unknown parachain ID', () => {
      const unknownParaId = 999;

      expect(() => service.getNodeByParaId(unknownParaId, 'polkadot')).toThrow(
        NotFoundException,
      );
      expect(getTNodeSpy).toHaveBeenCalledWith(unknownParaId, 'polkadot');
    });

    it('should throw BadRequestException for invalid ecosystem', () => {
      const invalidEcosystem = 'invalid';

      expect(() => service.getNodeByParaId(paraId, invalidEcosystem)).toThrow(
        BadRequestException,
      );
      expect(getTNodeSpy).not.toHaveBeenCalled();
    });
  });

  describe('getWsEndpoints', () => {
    it('should return the list of WS endpoints for a given node', () => {
      const result = service.getWsEndpoints(node);
      expect(result).toEqual(paraspellSdk.getNodeProviders(node));
    });
  });
});
