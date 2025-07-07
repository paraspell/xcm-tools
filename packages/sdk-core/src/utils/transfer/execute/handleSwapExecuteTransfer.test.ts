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

  it('throws when exchange destination fails with no destChain', async () => {
    const optionsNoDestChain = {
      ...baseOptions,
      destChain: undefined
    }

    const mockDryRunDestFailed = {
      origin: { success: true, fee: 100n },
      destination: { success: false, failureReason: 'Destination failed' },
      hops: []
    } as unknown as TDryRunResult

    vi.spyOn(dryRunModule, 'dryRunInternal').mockResolvedValueOnce(mockDryRunDestFailed)

    await expect(handleSwapExecuteTransfer(optionsNoDestChain)).rejects.toThrow(
      'Exchange (destination) failed when no origin reserve exists'
    )
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

  it('throws when hop before exchange fails in second dry run', async () => {
    const mockDryRunFirstSuccess = mockDryRunResult(true, true)
    const mockDryRunSecondFailure = {
      origin: { success: true, fee: 100n },
      hops: [
        {
          chain: 'A',
          result: { success: false, failureReason: 'Hop failed' }
        },
        {
          chain: 'B',
          result: { success: true, fee: 200n }
        }
      ]
    } as unknown as TDryRunResult

    vi.spyOn(dryRunModule, 'dryRunInternal')
      .mockResolvedValueOnce(mockDryRunFirstSuccess)
      .mockResolvedValueOnce(mockDryRunSecondFailure)

    await expect(handleSwapExecuteTransfer(baseOptions)).rejects.toThrow(
      'Hop before exchange failed: Hop failed'
    )
  })

  it('throws when hop after exchange fails', async () => {
    const mockDryRunFirstSuccess = mockDryRunResult(true, true)
    const mockDryRunSecondFailure = {
      origin: { success: true, fee: 100n },
      hops: [
        {
          chain: 'A',
          result: { success: true, fee: 100n }
        },
        {
          chain: 'B',
          result: { success: true, fee: 200n }
        },
        {
          chain: 'C',
          result: { success: false, failureReason: 'Destination hop failed' }
        }
      ]
    } as unknown as TDryRunResult

    vi.spyOn(dryRunModule, 'dryRunInternal')
      .mockResolvedValueOnce(mockDryRunFirstSuccess)
      .mockResolvedValueOnce(mockDryRunSecondFailure)

    await expect(handleSwapExecuteTransfer(baseOptions)).rejects.toThrow(
      'Hop after exchange failed: Destination hop failed'
    )
  })

  it('throws when origin reserve hop fails with no destChain', async () => {
    const optionsNoDestChain = {
      ...baseOptions,
      destChain: undefined
    }

    const mockDryRunFirstSuccess = {
      origin: { success: true, fee: 100n },
      destination: { success: true, fee: 300n },
      hops: [
        {
          chain: 'A',
          result: { success: true, fee: 150n }
        }
      ]
    } as unknown as TDryRunResult

    const mockDryRunSecondFailure = {
      origin: { success: true, fee: 100n },
      destination: { success: true, fee: 300n },
      hops: [
        {
          chain: 'A',
          result: { success: false, failureReason: 'Last hop failed' }
        }
      ]
    } as unknown as TDryRunResult

    vi.spyOn(dryRunModule, 'dryRunInternal')
      .mockResolvedValueOnce(mockDryRunFirstSuccess)
      .mockResolvedValueOnce(mockDryRunSecondFailure)

    await expect(handleSwapExecuteTransfer(optionsNoDestChain)).rejects.toThrow(
      'Origin reserve hop failed: Last hop failed'
    )
  })

  it('performs third iteration when fees change', async () => {
    const mockDryRunFirst = mockDryRunResult(true, true)
    const mockDryRunSecond = {
      origin: { success: true, fee: 100n },
      hops: [
        {
          chain: 'A',
          result: { success: true, fee: 200n }
        },
        {
          chain: 'B',
          result: { success: true, fee: 300n }
        },
        {
          chain: 'C',
          result: { success: true, fee: 150n }
        }
      ]
    } as unknown as TDryRunResult

    baseOptions.calculateMinAmountOut = vi
      .fn()
      .mockResolvedValueOnce(1500n)
      .mockResolvedValueOnce(1400n)

    vi.spyOn(dryRunModule, 'dryRunInternal')
      .mockResolvedValueOnce(mockDryRunFirst)
      .mockResolvedValueOnce(mockDryRunSecond)

    const result = await handleSwapExecuteTransfer(baseOptions)

    expect(result).toMatch(/^tx:/)
    expect(baseOptions.calculateMinAmountOut).toHaveBeenCalledTimes(2)
    expect(mockApi.callTxMethod).toHaveBeenCalledTimes(3)
  })

  it('handles case when origin chain is same as exchange chain', async () => {
    const optionsSameChain = {
      ...baseOptions,
      chain: 'B' as TNodeDotKsmWithRelayChains,
      exchangeChain: 'B' as TNodePolkadotKusama
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

  it('throws when exchange hop fails and no origin reserve exists', async () => {
    const mockDryRunNoOriginReserve = {
      origin: { success: true, fee: 100n },
      hops: [
        {
          chain: 'B',
          result: { success: false, failureReason: 'Exchange hop failed' }
        }
      ]
    } as unknown as TDryRunResult

    vi.spyOn(dryRunModule, 'dryRunInternal').mockResolvedValueOnce(mockDryRunNoOriginReserve)

    const optionsDirectToExchange = {
      ...baseOptions,
      chain: 'A' as TNodeDotKsmWithRelayChains
    }

    await expect(handleSwapExecuteTransfer(optionsDirectToExchange)).rejects.toThrow(
      'Exchange hop failed when no origin reserve exists: Exchange hop failed'
    )
  })

  it('throws when destination fails for exchange as final destination', async () => {
    const optionsNoDestChain = {
      ...baseOptions,
      destChain: undefined
    }

    const mockDryRunDestFailed = {
      origin: { success: true, fee: 100n },
      destination: { success: false, failureReason: 'Exchange destination failed' },
      hops: []
    } as unknown as TDryRunResult

    const mockDryRunDestSuccess = {
      origin: { success: true, fee: 100n },
      destination: { success: true, fee: 300n },
      hops: []
    } as unknown as TDryRunResult

    vi.spyOn(dryRunModule, 'dryRunInternal')
      .mockResolvedValueOnce(mockDryRunDestSuccess)
      .mockResolvedValueOnce(mockDryRunDestFailed)

    await expect(handleSwapExecuteTransfer(optionsNoDestChain)).rejects.toThrow(
      'Exchange (destination) failed: Exchange destination failed'
    )
  })
})
