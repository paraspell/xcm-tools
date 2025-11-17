/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/unbound-method */
import type { TChain, TParachain, TSubstrateChain } from '@paraspell/sdk-common'
import { replaceBigInt } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api'
import { AmountTooLowError, DryRunFailedError, InvalidParameterError } from '../../../errors'
import * as dryRunModule from '../../../transfer/dry-run/dryRunInternal'
import type { TCreateSwapXcmOptions } from '../../../types'
import { type TDryRunResult } from '../../../types'
import { handleSwapExecuteTransfer } from './handleSwapExecuteTransfer'

vi.mock('../../fees/padFee', () => ({
  padValueBy: (fee: bigint) => fee + 10n
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

vi.mock('../../../chains/config')

vi.mock('@paraspell/assets', () => ({
  hasXcmPaymentApiSupport: vi.fn().mockReturnValue(true)
}))

const mockApi = {
  init: vi.fn(),
  getXcmWeight: vi.fn(),
  deserializeExtrinsics: vi.fn()
} as unknown as IPolkadotApi<unknown, unknown>

const baseOptions = {
  api: mockApi,
  chain: 'A' as TSubstrateChain,
  exchangeChain: 'B' as TParachain,
  destChain: 'C' as TChain,
  assetInfoFrom: {
    amount: 2000n,
    location: {}
  },
  assetInfoTo: { location: {}, amount: 0n },
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
    mockApi.deserializeExtrinsics = vi
      .fn()
      .mockImplementation(call => `tx:${JSON.stringify(call, replaceBigInt)}`)
    mockApi.getXcmWeight = vi.fn().mockResolvedValue(100000n)
    mockApi.init = vi.fn()
  })

  it('throws if initial amount is too low', async () => {
    const options = {
      ...baseOptions,
      assetInfoFrom: { ...baseOptions.assetInfoFrom, amount: 500n }
    }

    await expect(handleSwapExecuteTransfer(options)).rejects.toThrow(AmountTooLowError)
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
      exchangeChain: 'B' as TParachain
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

  it('handles case when exchange chain is final destination', async () => {
    const optionsNoDestChain = {
      ...baseOptions,
      destChain: undefined
    }

    const mockDryRunNoDestChain = {
      origin: { success: true, fee: 100n },
      destination: { success: true, fee: 300n },
      hops: []
    } as unknown as TDryRunResult

    vi.spyOn(dryRunModule, 'dryRunInternal')
      .mockResolvedValueOnce(mockDryRunNoDestChain)
      .mockResolvedValueOnce(mockDryRunNoDestChain)

    const result = await handleSwapExecuteTransfer(optionsNoDestChain)
    expect(result).toMatch(/^tx:/)
  })

  it('extracts origin reserve fee from last hop when no destChain', async () => {
    const optionsNoDestChain = {
      ...baseOptions,
      destChain: undefined
    }

    const mockDryRunWithHops = {
      origin: { success: true, fee: 100n },
      destination: { success: true, fee: 300n },
      hops: [
        {
          chain: 'A',
          result: { success: true, fee: 150n }
        }
      ]
    } as unknown as TDryRunResult

    vi.spyOn(dryRunModule, 'dryRunInternal')
      .mockResolvedValueOnce(mockDryRunWithHops)
      .mockResolvedValueOnce(mockDryRunWithHops)

    const result = await handleSwapExecuteTransfer(optionsNoDestChain)
    expect(result).toMatch(/^tx:/)
    expect(baseOptions.calculateMinAmountOut).toHaveBeenCalledWith(1530n)
  })

  it('handles case when origin is exchange chain', async () => {
    const optionsNoChain = {
      ...baseOptions,
      chain: undefined,
      calculateMinAmountOut: vi.fn().mockResolvedValue(1500n)
    }

    const mockDryRunNoChain = {
      origin: { success: true, fee: 0n },
      hops: [
        {
          chain: 'C',
          result: { success: true, fee: 150n }
        }
      ]
    } as unknown as TDryRunResult

    vi.spyOn(dryRunModule, 'dryRunInternal')
      .mockResolvedValueOnce(mockDryRunNoChain)
      .mockResolvedValueOnce(mockDryRunNoChain)

    const result = await handleSwapExecuteTransfer(optionsNoChain)
    expect(result).toMatch(/^tx:/)
  })

  it('throws when origin dry run fails', async () => {
    const mockDryRunOriginFailed = {
      origin: { success: false, failureReason: 'Origin execution failed' },
      hops: []
    } as unknown as TDryRunResult

    vi.spyOn(dryRunModule, 'dryRunInternal').mockResolvedValueOnce(mockDryRunOriginFailed)

    await expect(handleSwapExecuteTransfer(baseOptions)).rejects.toThrow()
  })

  it('handles case when origin chain is same as exchange chain', async () => {
    const optionsSameChain = {
      ...baseOptions,
      chain: 'B' as TSubstrateChain,
      exchangeChain: 'B' as TParachain
    }

    const mockDryRunSameChain = {
      origin: { success: true, fee: 100n },
      destination: { success: true, fee: 200n },
      hops: [
        {
          chain: 'B',
          result: { success: true, fee: 100n }
        },
        {
          chain: 'C',
          result: { success: true, fee: 150n }
        }
      ]
    } as unknown as TDryRunResult

    vi.spyOn(dryRunModule, 'dryRunInternal')
      .mockResolvedValueOnce(mockDryRunSameChain)
      .mockResolvedValueOnce(mockDryRunSameChain)

    const result = await handleSwapExecuteTransfer(optionsSameChain)
    expect(result).toMatch(/^tx:/)
  })
})
