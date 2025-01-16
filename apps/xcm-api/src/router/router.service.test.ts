import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { RouterService } from './router.service.js';
import * as spellRouter from '@paraspell/xcm-router';
import type { RouterDto } from './dto/RouterDto.js';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import type { TNode } from '@paraspell/sdk';
import { InvalidCurrencyError } from '@paraspell/sdk';

vi.mock('@paraspell/xcm-router', async () => {
  const actual = await vi.importActual('@paraspell/xcm-router');
  return {
    ...actual,
    buildTransferExtrinsics: vi.fn().mockReturnValue([
      {
        node: 'Ethereum',
        tx: '0x123',
        type: 'ETH_TRANSFER',
        statusType: 'TO_EXCHANGE',
      },
      {
        node: 'AssetHubPolkadot',
        tx: '0x123',
        type: 'EXTRINSIC',
        statusType: 'SWAP',
      },
      {
        node: 'Astar',
        tx: '0x123',
        type: 'EXTRINSIC',
        statusType: 'TO_DESTINATION',
      },
    ]),
  };
});

describe('RouterService', () => {
  let service: RouterService;

  const options: RouterDto = {
    from: 'Astar',
    exchange: 'AcalaDex',
    to: 'Moonbeam',
    currencyFrom: { symbol: 'ASTR' },
    currencyTo: { symbol: 'GLMR' },
    amount: '1000000000000000000',
    injectorAddress: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
    recipientAddress: '5FA4TfhSWhoDJv39GZPvqjBzwakoX4XTVBNgviqd7sz2YeXC',
    type: spellRouter.TransactionType.TO_DESTINATION,
  };

  const invalidNode = 'Astarr';

  const serializedTx = '0x123';

  const serializedExtrinsics = [
    {
      node: 'Ethereum',
      tx: serializedTx,
      type: 'ETH_TRANSFER',
      statusType: 'TO_EXCHANGE',
    },
    {
      node: 'AssetHubPolkadot',
      tx: serializedTx,
      type: 'EXTRINSIC',
      statusType: 'SWAP',
    },
    {
      node: 'Astar',
      tx: serializedTx,
      type: 'EXTRINSIC',
      statusType: 'TO_DESTINATION',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RouterService],
    }).compile();

    service = module.get<RouterService>(RouterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateExtrinsics', () => {
    it('should generate 3 extrinsics with manual exchange selection', async () => {
      const spy = vi.spyOn(spellRouter, 'buildTransferExtrinsics');

      const result = await service.generateExtrinsics(options);

      expect(result).toStrictEqual(serializedExtrinsics);
      expect(spy).toHaveBeenCalledWith({
        ...options,
        slippagePct: '1',
      });
    });

    it('should throw BadRequestException for invalid from node', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        from: invalidNode as TNode,
      };

      const spy = vi.spyOn(spellRouter, 'buildTransferExtrinsics');

      await expect(service.generateExtrinsics(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid to node', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        to: invalidNode as TNode,
      };

      const spy = vi.spyOn(spellRouter, 'buildTransferExtrinsics');

      await expect(service.generateExtrinsics(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid exchange node', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        exchange: invalidNode as TNode,
      };

      const spy = vi.spyOn(spellRouter, 'buildTransferExtrinsics');

      await expect(service.generateExtrinsics(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid injector address', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        injectorAddress: invalidNode,
      };

      const spy = vi.spyOn(spellRouter, 'buildTransferExtrinsics');

      await expect(service.generateExtrinsics(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid recipient address', async () => {
      const modifiedOptions: RouterDto = {
        ...options,
        recipientAddress: invalidNode,
      };

      const spy = vi.spyOn(spellRouter, 'buildTransferExtrinsics');

      await expect(service.generateExtrinsics(modifiedOptions)).rejects.toThrow(
        BadRequestException,
      );
      expect(spy).not.toHaveBeenCalled();
    });

    it('should throw InternalServerError when uknown error occures in the spell router', async () => {
      vi.spyOn(spellRouter, 'buildTransferExtrinsics').mockImplementation(
        () => {
          throw new Error('Unknown error');
        },
      );

      await expect(service.generateExtrinsics(options)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InvalidCurrencyError when InvalidCurrencyError error occures in the spell router', async () => {
      vi.spyOn(spellRouter, 'buildTransferExtrinsics').mockImplementation(
        () => {
          throw new InvalidCurrencyError('Unknown error');
        },
      );

      await expect(service.generateExtrinsics(options)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
