import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/validateDestinationAddress', () => ({
  validateDestinationAddress: vi.fn(),
}));

import { validateDestinationAddress } from '../../utils/validateDestinationAddress';
import { validateTransferOptions } from './validateTransferOptions';
import type { TTransferOptions } from '../../types';

describe('validateTransferOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call validateDestinationAddress with recipientAddress and to', () => {
    const mockOptions = {
      evmInjectorAddress: undefined,
      injectorAddress: 'someInjectorAddress',
      recipientAddress: 'someRecipient',
      from: 'Astar',
      to: 'Polkadot',
    } as TTransferOptions;

    validateTransferOptions(mockOptions);

    expect(validateDestinationAddress).toHaveBeenCalledTimes(1);
    expect(validateDestinationAddress).toHaveBeenCalledWith(
      mockOptions.recipientAddress,
      mockOptions.to,
    );
  });

  it('should throw error if evmInjectorAddress is not a valid Ethereum address', () => {
    const invalidEvmAddress = '0x123-not-valid-address';
    const mockOptions = {
      evmInjectorAddress: invalidEvmAddress,
      injectorAddress: 'someAddress',
      recipientAddress: 'someRecipient',
      from: 'Polkadot',
      to: 'Astar',
    } as TTransferOptions;

    expect(() => validateTransferOptions(mockOptions)).toThrow(
      'Evm injector address is not a valid Ethereum address',
    );
  });

  it('should not throw error if evmInjectorAddress is a valid Ethereum address', () => {
    const validEvmAddress = '0x0000000000000000000000000000000000000001';
    const mockOptions = {
      evmInjectorAddress: validEvmAddress,
      injectorAddress: 'somePolkadotAddress',
      recipientAddress: 'someRecipient',
      from: 'Polkadot',
      to: 'Astar',
    } as TTransferOptions;

    expect(() => validateTransferOptions(mockOptions)).not.toThrow();
  });

  it('should throw error if injectorAddress is an Ethereum address', () => {
    const ethAddress = '0x0000000000000000000000000000000000000002';
    const mockOptions = {
      evmInjectorAddress: undefined,
      injectorAddress: ethAddress,
      recipientAddress: 'someRecipient',
      from: 'Polkadot',
      to: 'Astar',
    } as TTransferOptions;

    expect(() => validateTransferOptions(mockOptions)).toThrow(
      'Injector address cannot be an Ethereum address. Please use an Evm injector address instead.',
    );
  });

  it('should not throw any error for a normal valid scenario', () => {
    const mockOptions = {
      evmInjectorAddress: undefined,
      injectorAddress: 'somePolkadotAddress',
      recipientAddress: 'someRecipient',
      from: 'Polkadot',
      to: 'Astar',
    } as TTransferOptions;

    expect(() => validateTransferOptions(mockOptions)).not.toThrow();
  });
});
