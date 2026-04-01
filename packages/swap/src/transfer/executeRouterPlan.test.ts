import type { TPapiApi, TPapiTransaction } from '@paraspell/sdk';
import type { PolkadotApi } from '@paraspell/sdk-core';
import { isChainEvm } from '@paraspell/sdk-core';
import type { PolkadotSigner } from 'polkadot-api';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { TRouterPlan } from '../types';
import { executeRouterPlan } from './executeRouterPlan';

const mockSignAndSubmitFinalized = vi.fn();
const mockApi = { signAndSubmitFinalized: mockSignAndSubmitFinalized } as unknown as PolkadotApi<
  unknown,
  unknown,
  unknown
>;

vi.mock('@paraspell/sdk-core', async (importActual) => ({
  ...(await importActual()),
  isChainEvm: vi.fn(),
}));

describe('executeRouterPlan', () => {
  const mockSigner = {} as PolkadotSigner;
  const mockEvmSigner = {} as PolkadotSigner;
  const mockSenderAddress = 'sender-address';
  const mockEvmSenderAddress = 'evm-sender-address';
  const mockOnStatusChange = vi.fn();

  const baseOptions = {
    signer: mockSigner,
    sender: mockSenderAddress,
    evmSigner: mockEvmSigner,
    evmSenderAddress: mockEvmSenderAddress,
    onStatusChange: mockOnStatusChange,
    api: mockApi,
  };

  const mockPlan = [
    {
      api: {} as unknown as TPapiApi,
      tx: 'tx1' as unknown as TPapiTransaction,
      type: 'TRANSFER',
      chain: 'Astar',
      destinationChain: 'Moonbeam',
    },
    {
      api: {} as unknown as TPapiApi,
      tx: 'tx2' as unknown as TPapiTransaction,
      type: 'SWAP',
      chain: 'Unique',
    },
  ] as TRouterPlan<unknown, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isChainEvm).mockImplementation((chain) => chain === 'Unique');
  });

  test('should execute plan with both EVM and non-EVM transactions', async () => {
    await executeRouterPlan(mockPlan, { ...baseOptions, destination: 'Moonbeam' });
    expect(mockOnStatusChange).toHaveBeenCalledTimes(3);
    expect(mockOnStatusChange).toHaveBeenNthCalledWith(1, {
      chain: 'Astar',
      destinationChain: 'Moonbeam',
      type: 'TRANSFER',
      currentStep: 0,
      routerPlan: mockPlan,
    });
    expect(mockOnStatusChange).toHaveBeenNthCalledWith(2, {
      chain: 'Unique',
      type: 'SWAP',
      currentStep: 1,
      routerPlan: mockPlan,
    });
    expect(mockOnStatusChange).toHaveBeenNthCalledWith(3, {
      type: 'COMPLETED',
      currentStep: 1,
      routerPlan: mockPlan,
    });

    expect(mockSignAndSubmitFinalized).toHaveBeenCalledTimes(2);
    expect(mockSignAndSubmitFinalized).toHaveBeenNthCalledWith(1, 'tx1', mockSigner);
    expect(mockSignAndSubmitFinalized).toHaveBeenNthCalledWith(2, 'tx2', mockEvmSigner);
  });

  test('should handle empty plan gracefully', async () => {
    await executeRouterPlan([], { ...baseOptions, destination: 'Moonbeam' });
    expect(mockOnStatusChange).toHaveBeenCalledWith({
      type: 'COMPLETED',
      routerPlan: [],
      currentStep: -1,
    });
    expect(mockSignAndSubmitFinalized).not.toHaveBeenCalled();
  });

  test('should work without onStatusChange callback', async () => {
    await executeRouterPlan(mockPlan, {
      ...baseOptions,
      destination: 'Moonbeam',
      onStatusChange: undefined,
    });
    expect(mockSignAndSubmitFinalized).toHaveBeenCalledTimes(2);
  });

  test('should handle mixed chain types correctly', async () => {
    const mixedPlan = [
      { ...mockPlan[0], chain: 'Ethereum' },
      { ...mockPlan[1], chain: 'Polkadot' },
    ] as TRouterPlan<unknown, unknown>;

    vi.mocked(isChainEvm).mockImplementation((chain) => chain === 'Ethereum');

    await executeRouterPlan(mixedPlan, { ...baseOptions, destination: 'Moonbeam' });

    expect(mockSignAndSubmitFinalized).toHaveBeenNthCalledWith(1, 'tx1', mockEvmSigner);
    expect(mockSignAndSubmitFinalized).toHaveBeenNthCalledWith(2, 'tx2', mockSigner);
  });
});
