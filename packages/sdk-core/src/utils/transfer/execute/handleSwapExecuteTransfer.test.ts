/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/unbound-method */
import {
  replaceBigInt,
  type TNodeDotKsmWithRelayChains,
  type TNodePolkadotKusama
} from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api'
import { DryRunFailedError, InvalidParameterError } from '../../../errors'
import * as dryRunModule from '../../../transfer/dryRun/dryRunInternal'
import type { TCreateSwapXcmOptions } from '../../../types'
import { type TDryRunResult } from '../../../types'
import { handleSwapExecuteTransfer } from './handleSwapExecuteTransfer'

vi.mock('../../../transfer/fees/padFee', () => ({
  padFeeBy: (fee: bigint) => fee + 10n
}))

vi.mock('../../chain', () => ({
  getChainVersion: () => 2
}))

vi.mock('./createExecuteCall', () => ({
  createExecuteCall: (xcm: any, weight: bigint) => ({ xcm, weight, call: true })
}))

vi.mock('./createSwapExecuteXcm', () => ({
  createSwapExecuteXcm: () => 'mocked-xcm'
}))

vi.mock('./isMultiHopSwap', () => ({
  isMultiHopSwap: () => true
}))

vi.mock('../../../nodes/config', () => ({
  getParaId: vi.fn()
}))

const mockApi = {
  init: vi.fn(),
  getXcmWeight: vi.fn(),
  callTxMethod: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

const baseOptions = {
  api: mockApi,
  chain: 'A' as TNodeDotKsmWithRelayChains,
  exchangeChain: 'B' as TNodePolkadotKusama,
  destChain: 'C' as TNodeDotKsmWithRelayChains,
  assetFrom: {
    amount: '2000',
    multiLocation: {}
  },
  assetTo: { multiLocation: {}, amount: '0' },
  senderAddress: 'alice',
  recipientAddress: 'bob',
  calculateMinAmountOut: vi.fn().mockResolvedValue(1500n)
} as unknown as TCreateSwapXcmOptions<unknown, unknown>

const mockDryRunResult = (success = true, includeOrigin = false) =>
  ({
    origin: {
      success: includeOrigin,
      fee: 500n,
      failureReason: includeOrigin ? undefined : 'Origin failed'
    },
    hops: [
      {
        chain: 'A',
        result: {
          success: true,
          fee: 100n
        }
      },
      {
        chain: 'B',
        result: {
          success,
          fee: 200n,
          failureReason: success ? undefined : 'Exchange failed'
        }
      },
      {
        chain: 'C',
        result: {
          success: true,
          fee: 150n
        }
      }
    ]
  }) as unknown as TDryRunResult

describe('handleSwapExecuteTransfer', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    baseOptions.calculateMinAmountOut = vi.fn().mockResolvedValue(1500n)
    mockApi.callTxMethod = vi
      .fn()
      .mockImplementation(call => `tx:${JSON.stringify(call, replaceBigInt)}`)
    mockApi.getXcmWeight = vi.fn().mockResolvedValue(100000n)
    mockApi.init = vi.fn()
  })

  it('throws if initial amount is too low', async () => {
    const options = { ...baseOptions, assetFrom: { ...baseOptions.assetFrom, amount: '500' } }

    await expect(handleSwapExecuteTransfer(options)).rejects.toThrow(InvalidParameterError)
  })

  it('throws if dry run fails', async () => {
    vi.spyOn(dryRunModule, 'dryRunInternal').mockResolvedValueOnce(mockDryRunResult(false))

    await expect(handleSwapExecuteTransfer(baseOptions)).rejects.toThrow(DryRunFailedError)
  })

  it('throws if exchange hop is missing', async () => {
    const dryRunMissingExchange = {
      origin: { success: true, fee: 0n },
      hops: [
        { chain: 'A', result: { success: true, fee: 0n } },
        { chain: 'C', result: { success: true, fee: 0n } }
      ]
    } as unknown as TDryRunResult

    vi.spyOn(dryRunModule, 'dryRunInternal').mockResolvedValue(dryRunMissingExchange)

    const options = {
      ...baseOptions,
      exchangeChain: 'B' as TNodePolkadotKusama
    }

    await expect(handleSwapExecuteTransfer(options)).rejects.toThrow(InvalidParameterError)
  })

  it('returns final tx call on success', async () => {
    baseOptions.calculateMinAmountOut = vi.fn().mockResolvedValue(1500n)

    vi.spyOn(dryRunModule, 'dryRunInternal')
      .mockResolvedValueOnce(mockDryRunResult(true, true))
      .mockResolvedValueOnce(mockDryRunResult(true, true))
      .mockResolvedValueOnce(mockDryRunResult(true, true))

    const result = await handleSwapExecuteTransfer(baseOptions)

    expect(result).toMatch(/^tx:/)
    expect(mockApi.init).toHaveBeenCalled()
    expect(baseOptions.calculateMinAmountOut).toHaveBeenCalledWith(1680n)
  })

  it('throws if second dry run fails', async () => {
    vi.spyOn(dryRunModule, 'dryRunInternal')
      .mockResolvedValueOnce(mockDryRunResult(true, true))
      .mockResolvedValueOnce(mockDryRunResult(false, true))

    await expect(handleSwapExecuteTransfer(baseOptions)).rejects.toThrow(DryRunFailedError)
  })
})
