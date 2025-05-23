import type { TPapiApi, TPapiTransaction } from '@paraspell/sdk';
import { getBalanceNative, isNodeEvm } from '@paraspell/sdk';
import BigNumber from 'bignumber.js';
import type { PolkadotSigner, TxFinalizedPayload } from 'polkadot-api';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { TExecuteRouterPlanOptions, TRouterPlan } from '../types';
import { calculateTxFeeDryRun } from '../utils';
import { submitTransaction } from '../utils/submitTransaction';
import { executeRouterPlan } from './executeRouterPlan';

vi.mock('@paraspell/sdk', () => ({
  isNodeEvm: vi.fn(),
  getBalanceNative: vi.fn(),
  InvalidParameterError: class extends Error {},
}));

vi.mock('../utils/submitTransaction', () => ({
  submitTransaction: vi.fn(),
}));

vi.mock('../utils', () => ({
  calculateTxFeeDryRun: vi.fn(),
}));

describe('executeRouterPlan', () => {
  const mockSigner = {} as PolkadotSigner;
  const mockEvmSigner = {} as PolkadotSigner;
  const mockSenderAddress = 'sender-address';
  const mockEvmSenderAddress = 'evm-sender-address';
  const mockOnStatusChange = vi.fn();

  const baseOptions = {
    signer: mockSigner,
    senderAddress: mockSenderAddress,
    evmSigner: mockEvmSigner,
    evmSenderAddress: mockEvmSenderAddress,
    onStatusChange: mockOnStatusChange,
  };

  const mockPlan = [
    {
      api: {} as unknown as TPapiApi,
      tx: 'tx1' as unknown as TPapiTransaction,
      type: 'TRANSFER',
      node: 'Astar',
      destinationNode: 'Moonbeam',
    },
    {
      api: {} as unknown as TPapiApi,
      tx: 'tx2' as unknown as TPapiTransaction,
      type: 'SWAP',
      node: 'Unique',
    },
  ] as TRouterPlan;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isNodeEvm).mockImplementation((node) => node === 'Unique');
    vi.mocked(submitTransaction).mockResolvedValue({} as TxFinalizedPayload);
    vi.mocked(getBalanceNative).mockResolvedValue(10000000000n);
    vi.mocked(calculateTxFeeDryRun).mockResolvedValue(BigNumber(5000000000));
  });

  test('should execute plan with both EVM and non-EVM transactions', async () => {
    await executeRouterPlan(mockPlan, { ...baseOptions, destination: 'Moonbeam' });
    expect(mockOnStatusChange).toHaveBeenCalledTimes(3);
    expect(mockOnStatusChange).toHaveBeenNthCalledWith(1, {
      node: 'Astar',
      destinationNode: 'Moonbeam',
      type: 'TRANSFER',
      currentStep: 0,
      routerPlan: mockPlan,
    });
    expect(mockOnStatusChange).toHaveBeenNthCalledWith(2, {
      node: 'Unique',
      type: 'SWAP',
      currentStep: 1,
      routerPlan: mockPlan,
    });
    expect(mockOnStatusChange).toHaveBeenNthCalledWith(3, {
      type: 'COMPLETED',
      currentStep: 1,
      routerPlan: mockPlan,
    });

    expect(submitTransaction).toHaveBeenCalledTimes(2);
    expect(submitTransaction).toHaveBeenNthCalledWith(1, 'tx1', mockSigner);
    expect(submitTransaction).toHaveBeenNthCalledWith(2, 'tx2', mockEvmSigner);
  });

  test('should throw error for EVM transaction without EVM signer/sender', async () => {
    const invalidOptions = {
      ...baseOptions,
      destination: 'Moonbeam',
      evmSigner: undefined,
      evmSenderAddress: undefined,
    } as TExecuteRouterPlanOptions;
    await expect(executeRouterPlan(mockPlan, invalidOptions)).rejects.toThrow(
      'EVM signer and sender address must be provided for EVM nodes.',
    );
  });

  test('should handle empty plan gracefully', async () => {
    await executeRouterPlan([], { ...baseOptions, destination: 'Moonbeam' });
    expect(mockOnStatusChange).toHaveBeenCalledWith({
      type: 'COMPLETED',
      routerPlan: [],
      currentStep: -1,
    });
    expect(submitTransaction).not.toHaveBeenCalled();
  });

  test('should work without onStatusChange callback', async () => {
    await executeRouterPlan(mockPlan, {
      ...baseOptions,
      destination: 'Moonbeam',
      onStatusChange: undefined,
    });
    expect(submitTransaction).toHaveBeenCalledTimes(2);
  });

  test('should handle mixed node types correctly', async () => {
    const mixedPlan = [
      { ...mockPlan[0], node: 'Ethereum' },
      { ...mockPlan[1], node: 'Polkadot' },
    ] as TRouterPlan;

    vi.mocked(isNodeEvm).mockImplementation((node) => node === 'Ethereum');

    await executeRouterPlan(mixedPlan, { ...baseOptions, destination: 'Moonbeam' });

    expect(submitTransaction).toHaveBeenNthCalledWith(1, 'tx1', mockEvmSigner);
    expect(submitTransaction).toHaveBeenNthCalledWith(2, 'tx2', mockSigner);
  });

  test('should run fee dry run when transferring from BifrostPolkadot to destinationNode', async () => {
    const plan = [
      {
        api: {} as unknown as TPapiApi,
        tx: 'txBifrost' as unknown as TPapiTransaction,
        type: 'TRANSFER',
        node: 'BifrostPolkadot',
        destinationNode: 'Astar',
      },
    ] as TRouterPlan;

    await executeRouterPlan(plan, {
      ...baseOptions,
      destination: 'Astar',
    });
    expect(calculateTxFeeDryRun).toHaveBeenCalledWith(
      plan[0].api,
      'BifrostPolkadot',
      'txBifrost',
      mockSenderAddress,
    );
    expect(getBalanceNative).toHaveBeenCalledWith({
      api: plan[0].api,
      address: mockSenderAddress,
      node: 'BifrostPolkadot',
    });
    expect(submitTransaction).toHaveBeenCalledWith('txBifrost', mockSigner);
  });

  test('should throw error if BifrostPolkadot insufficient balance for fees', async () => {
    const plan = [
      {
        api: {} as unknown as TPapiApi,
        tx: 'txInsufficient' as unknown as TPapiTransaction,
        type: 'TRANSFER',
        node: 'BifrostPolkadot',
        destinationNode: 'Astar',
      },
    ] as TRouterPlan;

    vi.mocked(calculateTxFeeDryRun).mockResolvedValue(BigNumber(50000000000));
    vi.mocked(getBalanceNative).mockResolvedValue(1000n);

    await expect(
      executeRouterPlan(plan, {
        ...baseOptions,
        destination: 'Astar',
      }),
    ).rejects.toThrow(
      'Insufficient balance to cover fees for transfer from BifrostPolkadot to Astar',
    );

    expect(calculateTxFeeDryRun).toHaveBeenCalled();
    expect(getBalanceNative).toHaveBeenCalled();
    expect(submitTransaction).not.toHaveBeenCalled();
  });
});
