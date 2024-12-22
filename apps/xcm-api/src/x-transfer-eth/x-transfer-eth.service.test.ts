import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { TSerializedEthTransfer } from '@paraspell/sdk';
import { buildEthTransferOptions } from '@paraspell/sdk';
import { isValidPolkadotAddress } from '../utils.js';
import type { XTransferEthDto } from './dto/x-transfer-eth.dto.js';
import { XTransferEthService } from './x-transfer-eth.service.js';

vi.mock('@paraspell/sdk', () => ({
  NODE_NAMES_DOT_KSM: ['Polkadot', 'Kusama', 'AssetHubPolkadot'],
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

  it('should throw BadRequestException if the from node is invalid', async () => {
    const dto: XTransferEthDto = {
      from: 'InvalidNode',
      to: 'AssetHubPolkadot',
      address: '0xAddress',
      destAddress: '1DestinationAddress',
      currency: { symbol: 'DOT', amount: 100 },
    };

    await expect(service.generateEthCall(dto)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.generateEthCall(dto)).rejects.toThrow(
      'Node InvalidNode is not valid. Check docs for valid nodes.',
    );
  });

  it('should throw BadRequestException if the to node is invalid', async () => {
    const dto: XTransferEthDto = {
      from: 'Ethereum',
      to: 'InvalidNode',
      address: '0xAddress',
      destAddress: '1DestinationAddress',
      currency: { symbol: 'DOT', amount: 100 },
    };

    await expect(service.generateEthCall(dto)).rejects.toThrow(
      BadRequestException,
    );
    await expect(service.generateEthCall(dto)).rejects.toThrow(
      'Node InvalidNode is not valid. Check docs for valid nodes.',
    );
  });

  it('should throw BadRequestException if the destination address is invalid', async () => {
    const dto: XTransferEthDto = {
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xAddress',
      destAddress: 'InvalidAddress',
      currency: { symbol: 'DOT', amount: 100 },
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
    const dto: XTransferEthDto = {
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xAddress',
      destAddress: '1DestinationAddress',
      currency: { symbol: 'DOT', amount: 100 },
    };

    const mockResult = { success: true };

    vi.mocked(isValidPolkadotAddress).mockReturnValue(true);
    vi.mocked(buildEthTransferOptions).mockResolvedValue(
      mockResult as unknown as TSerializedEthTransfer,
    );

    const result = await service.generateEthCall(dto);

    expect(result).toBe(mockResult);
    expect(buildEthTransferOptions).toHaveBeenCalledWith({
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xAddress',
      destAddress: '1DestinationAddress',
      currency: { symbol: 'DOT', amount: 100 },
    });
  });

  it('should throw InternalServerErrorException when buildEthTransferOptions throws an error', async () => {
    const dto: XTransferEthDto = {
      from: 'Ethereum',
      to: 'AssetHubPolkadot',
      address: '0xAddress',
      destAddress: '1DestinationAddress',
      currency: { symbol: 'DOT', amount: 100 },
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
