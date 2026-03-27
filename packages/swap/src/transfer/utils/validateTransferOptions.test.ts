import { MissingParameterError } from '@paraspell/sdk-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TBuildTransactionsOptions } from '../../types';
import { validateDestinationAddress } from '../../utils/validateDestinationAddress';
import { validateTransferOptions } from './validateTransferOptions';

vi.mock('../../utils/validateDestinationAddress');

describe('validateTransferOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error if both from and exchange are undefined', () => {
    const mockOptions = {
      evmSenderAddress: undefined,
      sender: 'someAddress',
      recipient: 'someRecipient',
      from: undefined,
      to: 'Astar',
    } as TBuildTransactionsOptions<unknown, unknown, unknown>;

    expect(() => validateTransferOptions(mockOptions)).toThrow(MissingParameterError);
  });

  it('should throw error if to is defined but recipient is undefined', () => {
    const mockOptions = {
      evmSenderAddress: undefined,
      sender: 'someAddress',
      recipient: undefined,
      from: 'Polkadot',
      to: 'Astar',
    } as TBuildTransactionsOptions<unknown, unknown, unknown>;

    expect(() => validateTransferOptions(mockOptions)).toThrow(MissingParameterError);
  });

  it('should call validateDestinationAddress with recipient and to', () => {
    const mockOptions = {
      evmSenderAddress: undefined,
      sender: 'someInjectorAddress',
      recipient: 'someRecipient',
      from: 'Astar',
      to: 'Polkadot',
    } as TBuildTransactionsOptions<unknown, unknown, unknown>;

    validateTransferOptions(mockOptions);

    expect(validateDestinationAddress).toHaveBeenCalledTimes(1);
    expect(validateDestinationAddress).toHaveBeenCalledWith(mockOptions.recipient, mockOptions.to);
  });

  it('should throw error if evmInjectorAddress is not a valid Ethereum address', () => {
    const invalidEvmAddress = '0x123-not-valid-address';
    const mockOptions = {
      evmSenderAddress: invalidEvmAddress,
      sender: 'someAddress',
      recipient: 'someRecipient',
      from: 'Polkadot',
      to: 'Astar',
    } as TBuildTransactionsOptions<unknown, unknown, unknown>;

    expect(() => validateTransferOptions(mockOptions)).toThrow(
      'Evm injector address is not a valid Ethereum address',
    );
  });

  it('should not throw error if evmInjectorAddress is a valid Ethereum address', () => {
    const validEvmAddress = '0x0000000000000000000000000000000000000001';
    const mockOptions = {
      evmSenderAddress: validEvmAddress,
      sender: 'somePolkadotAddress',
      recipient: 'someRecipient',
      from: 'Polkadot',
      to: 'Astar',
    } as TBuildTransactionsOptions<unknown, unknown, unknown>;

    expect(() => validateTransferOptions(mockOptions)).not.toThrow();
  });

  it('should throw error if injectorAddress is an Ethereum address', () => {
    const ethAddress = '0x0000000000000000000000000000000000000002';
    const mockOptions = {
      evmSenderAddress: undefined,
      sender: ethAddress,
      recipient: 'someRecipient',
      from: 'Polkadot',
      to: 'Astar',
    } as TBuildTransactionsOptions<unknown, unknown, unknown>;

    expect(() => validateTransferOptions(mockOptions)).toThrow(
      'Injector address cannot be an Ethereum address. Please use an Evm injector address instead.',
    );
  });

  it('should not throw any error for a normal valid scenario', () => {
    const mockOptions = {
      evmSenderAddress: undefined,
      sender: 'somePolkadotAddress',
      recipient: 'someRecipient',
      from: 'Polkadot',
      to: 'Astar',
    } as TBuildTransactionsOptions<unknown, unknown, unknown>;

    expect(() => validateTransferOptions(mockOptions)).not.toThrow();
  });

  it('should require an EVM sender address when origin chain is EVM', () => {
    const mockOptions = {
      evmSenderAddress: undefined,
      sender: 'somePolkadotAddress',
      recipient: undefined,
      from: 'Moonbeam',
      to: undefined,
    } as TBuildTransactionsOptions<unknown, unknown, unknown>;

    expect(() => validateTransferOptions(mockOptions)).toThrow(MissingParameterError);
  });
});
