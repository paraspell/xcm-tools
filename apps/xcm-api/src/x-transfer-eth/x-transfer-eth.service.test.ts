import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { TSerializedEthTransfer } from '@paraspell/sdk';
import { buildEthTransferOptions } from '@paraspell/sdk';
import { isValidPolkadotAddress } from '../utils.js';
import type { PatchedXTransferEthDto } from './dto/x-transfer-eth.dto.js';
import { XTransferEthService } from './x-transfer-eth.service.js';

vi.mock('@paraspell/sdk', () => ({
  NODE_NAMES_DOT_KSM: ['Polkadot', 'Kusama'],
  buildEthTransferOptions: vi.fn(),
}));

vi.mock('../utils.js', () => ({
  isValidPolkadotAddress: vi.fn(),
}));

describe('XTransferEthService', () => {
  let service: XTransferEthService;

  beforeEach(() => {
    service = new XTransferEthService();
  });

  it('should throw BadRequestException if the node is invalid', async () => {
    const dto: PatchedXTransferEthDto = {
      to: 'InvalidNode',
      amount: 100,
      address: '0xAddress',
      destAddress: '1DestinationAddress',
      currency: { symbol: 'DOT' },
    };

    await expect(service.generateEthCall(dto)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.generateEthCall(dto)).rejects.toThrow(
      'Node InvalidNode is not valid. Check docs for valid nodes.',
    );
  });

  it('should throw BadRequestException if the destination address is invalid', async () => {
    const dto: PatchedXTransferEthDto = {
      to: 'Polkadot',
      amount: 100,
      address: '0xAddress',
      destAddress: 'InvalidAddress',
      currency: { symbol: 'DOT' },
    };

    vi.mocked(isValidPolkadotAddress).mockReturnValue(false);

    await expect(service.generateEthCall(dto)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.generateEthCall(dto)).rejects.toThrow(
      'Invalid wallet address.',
    );
  });

  it('should return the result from buildEthTransferOptions for valid input', async () => {
    const dto: PatchedXTransferEthDto = {
      to: 'Polkadot',
      amount: 100,
      address: '0xAddress',
      destAddress: '1DestinationAddress',
      currency: { symbol: 'DOT' },
    };

    const mockResult = { success: true };

    vi.mocked(isValidPolkadotAddress).mockReturnValue(true);
    vi.mocked(buildEthTransferOptions).mockResolvedValue(
      mockResult as unknown as TSerializedEthTransfer,
    );

    const result = await service.generateEthCall(dto);

    expect(result).toBe(mockResult);
    expect(buildEthTransferOptions).toHaveBeenCalledWith({
      to: 'Polkadot',
      amount: '100',
      address: '0xAddress',
      destAddress: '1DestinationAddress',
      currency: { symbol: 'DOT' },
    });
  });

  it('should throw InternalServerErrorException when buildEthTransferOptions throws an error', async () => {
    const dto: PatchedXTransferEthDto = {
      to: 'Polkadot',
      amount: 100,
      address: '0xAddress',
      destAddress: '1DestinationAddress',
      currency: { symbol: 'DOT' },
    };

    vi.mocked(isValidPolkadotAddress).mockReturnValue(true);
    vi.mocked(buildEthTransferOptions).mockRejectedValue(
      new Error('Something went wrong'),
    );

    await expect(service.generateEthCall(dto)).rejects.toThrow(
      InternalServerErrorException,
    );
    await expect(service.generateEthCall(dto)).rejects.toThrow(
      'Something went wrong',
    );
  });
});
