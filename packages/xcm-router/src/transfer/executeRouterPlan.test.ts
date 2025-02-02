import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Extrinsic, TPjsApi } from '@paraspell/sdk-pjs';
import { isNodeEvm } from '@paraspell/sdk-pjs';
import type { TRouterPlan } from '../types';
import { submitTransaction } from '../utils/submitTransaction';
import { executeRouterPlan } from './executeRouterPlan';
import type { Signer } from '@polkadot/types/types';

vi.mock('@paraspell/sdk-pjs', () => ({
  isNodeEvm: vi.fn(),
}));

vi.mock('../utils/submitTransaction', () => ({
  submitTransaction: vi.fn(),
}));

describe('executeRouterPlan', () => {
  const mockSigner = {} as Signer;
  const mockEvmSigner = {} as Signer;
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
      api: {} as unknown as TPjsApi,
      tx: 'tx1' as unknown as Extrinsic,
      type: 'TRANSFER',
      node: 'Astar',
      destinationNode: 'Moonbeam',
    },
    {
      api: {} as unknown as TPjsApi,
      tx: 'tx2' as unknown as Extrinsic,
      type: 'SWAP',
      node: 'Unique',
    },
  ] as TRouterPlan;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isNodeEvm).mockImplementation((node) => node === 'Unique');
    vi.mocked(submitTransaction).mockResolvedValue('');
  });

  test('should execute plan with both EVM and non-EVM transactions', async () => {
    await executeRouterPlan(mockPlan, baseOptions);

    expect(mockOnStatusChange).toHaveBeenCalledTimes(3);
    expect(mockOnStatusChange).toHaveBeenNthCalledWith(1, {
      node: 'Astar',
      destinationNode: 'Moonbeam',
      type: 'TRANSFER',
      currentStep: 0,
      routerPlan: [
        {
          api: {},
          destinationNode: 'Moonbeam',
          node: 'Astar',
          tx: 'tx1',
          type: 'TRANSFER',
        },
        {
          api: {},
          node: 'Unique',
          tx: 'tx2',
          type: 'SWAP',
        },
      ],
    });
    expect(mockOnStatusChange).toHaveBeenNthCalledWith(2, {
      node: 'Unique',
      type: 'SWAP',
      currentStep: 1,
      routerPlan: [
        {
          api: {},
          destinationNode: 'Moonbeam',
          node: 'Astar',
          tx: 'tx1',
          type: 'TRANSFER',
        },
        {
          api: {},
          node: 'Unique',
          tx: 'tx2',
          type: 'SWAP',
        },
      ],
    });
    expect(mockOnStatusChange).toHaveBeenNthCalledWith(3, {
      type: 'COMPLETED',
      currentStep: 1,
      routerPlan: [
        {
          api: {},
          destinationNode: 'Moonbeam',
          node: 'Astar',
          tx: 'tx1',
          type: 'TRANSFER',
        },
        {
          api: {},
          node: 'Unique',
          tx: 'tx2',
          type: 'SWAP',
        },
      ],
    });

    // Verify transaction submissions
    expect(submitTransaction).toHaveBeenCalledTimes(2);
    expect(submitTransaction).toHaveBeenNthCalledWith(
      1,
      mockPlan[0].api,
      'tx1',
      mockSigner,
      mockSenderAddress,
    );
    expect(submitTransaction).toHaveBeenNthCalledWith(
      2,
      mockPlan[1].api,
      'tx2',
      mockEvmSigner,
      mockEvmSenderAddress,
    );
  });

  test('should throw error for EVM transaction without EVM signer/sender', async () => {
    const invalidOptions = {
      ...baseOptions,
      evmSigner: undefined,
      evmSenderAddress: undefined,
    };

    await expect(executeRouterPlan(mockPlan, invalidOptions)).rejects.toThrow(
      'EVM signer and sender address must be provided for EVM nodes.',
    );
  });

  test('should handle empty plan gracefully', async () => {
    await executeRouterPlan([], baseOptions);
    expect(mockOnStatusChange).toHaveBeenCalledWith({
      type: 'COMPLETED',
      routerPlan: [],
      currentStep: -1,
    });
    expect(submitTransaction).not.toHaveBeenCalled();
  });

  test('should work without onStatusChange callback', async () => {
    const optionsWithoutCallback = { ...baseOptions, onStatusChange: undefined };
    await executeRouterPlan(mockPlan, optionsWithoutCallback);
    expect(submitTransaction).toHaveBeenCalledTimes(2);
  });

  test('should handle mixed node types correctly', async () => {
    const mixedPlan = [
      { ...mockPlan[0], node: 'Ethereum' },
      { ...mockPlan[1], node: 'Polkadot' },
    ] as TRouterPlan;

    vi.mocked(isNodeEvm).mockImplementation((node) => node === 'Ethereum');

    await executeRouterPlan(mixedPlan, baseOptions);

    expect(submitTransaction).toHaveBeenNthCalledWith(
      1,
      mixedPlan[0].api,
      'tx1',
      mockEvmSigner,
      mockEvmSenderAddress,
    );
    expect(submitTransaction).toHaveBeenNthCalledWith(
      2,
      mixedPlan[1].api,
      'tx2',
      mockSigner,
      mockSenderAddress,
    );
  });
});
