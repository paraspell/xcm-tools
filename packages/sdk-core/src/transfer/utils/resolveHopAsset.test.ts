import type { TAssetInfo, TCurrencyCore, TCurrencyInputWithAmount } from '@paraspell/assets'
import {
  findAssetInfoOnDest,
  findAssetOnDestOrThrow,
  findNativeAssetInfoOrThrow
} from '@paraspell/assets'
import { deepEqual, getJunctionValue, Parents } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TResolveHopParams, TSwapConfig } from '../../types'
import { getRelayChainOf } from '../../utils'
import { resolveHopAsset } from './resolveHopAsset'

vi.mock('@paraspell/assets')

vi.mock('@paraspell/sdk-common', async () => {
  const actual =
    await vi.importActual<typeof import('@paraspell/sdk-common')>('@paraspell/sdk-common')

  return {
    ...actual,
    deepEqual: vi.fn(),
    getJunctionValue: vi.fn()
  }
})

vi.mock('../../utils')

describe('resolveHopAsset', () => {
  const baseParams: Omit<TResolveHopParams, 'asset'> = {
    originChain: 'Acala',
    currentChain: 'Astar',
    destination: 'Ethereum',
    currency: {} as TCurrencyInputWithAmount,
    hasPassedExchange: false
  }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getJunctionValue).mockReturnValue(undefined)
    vi.mocked(deepEqual).mockReturnValue(false)
  })

  it('returns the relay native asset when the hop asset reserves are external', () => {
    const relayAsset = { symbol: 'KSM' } as TAssetInfo
    vi.mocked(getRelayChainOf).mockReturnValue('Kusama')
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValue(relayAsset)

    const asset = { symbol: 'DOT', location: { parents: Parents.TWO } } as TAssetInfo

    const result = resolveHopAsset({ ...baseParams, asset })

    expect(getRelayChainOf).toHaveBeenCalledWith(baseParams.currentChain)
    expect(findNativeAssetInfoOrThrow).toHaveBeenCalledWith('Kusama')
    expect(result).toBe(relayAsset)
  })

  it('does not treat relay-backed assets with GlobalConsensus as external', () => {
    const asset = { symbol: 'DOT', location: { parents: Parents.TWO } } as TAssetInfo
    const destAsset = { symbol: 'DOT' } as TAssetInfo

    vi.mocked(getJunctionValue).mockReturnValue({ polkadot: null })
    vi.mocked(deepEqual).mockImplementation(
      (value, expected) => JSON.stringify(value) === JSON.stringify(expected)
    )
    vi.mocked(findAssetInfoOnDest).mockReturnValue(destAsset)

    const result = resolveHopAsset({ ...baseParams, asset })

    expect(findNativeAssetInfoOrThrow).not.toHaveBeenCalled()
    expect(findAssetInfoOnDest).toHaveBeenCalledWith(
      baseParams.originChain,
      baseParams.currentChain,
      baseParams.currency
    )
    expect(result).toBe(destAsset)
  })

  it('returns the post-swap asset when swap has been performed and the hop is not on the exchange chain', () => {
    const expectedAsset = { symbol: 'USDT' } as TAssetInfo
    const swapConfig: TSwapConfig = {
      exchangeChain: 'Astar',
      currencyTo: { symbol: 'USDT' } as TCurrencyCore
    }

    vi.mocked(findAssetOnDestOrThrow).mockReturnValue(expectedAsset)

    const asset = { symbol: 'DOT' } as TAssetInfo

    const result = resolveHopAsset({
      ...baseParams,
      asset,
      hasPassedExchange: true,
      swapConfig,
      currentChain: 'Moonbeam'
    })

    expect(findAssetOnDestOrThrow).toHaveBeenCalledWith(
      swapConfig.exchangeChain,
      'Moonbeam',
      swapConfig.currencyTo
    )
    expect(result).toBe(expectedAsset)
  })

  it('returns asset info on destination or falls back to the original asset', () => {
    const asset = { symbol: 'DOT' } as TAssetInfo
    const destAsset = { symbol: 'DOT' } as TAssetInfo

    vi.mocked(findAssetInfoOnDest).mockReturnValueOnce(destAsset).mockReturnValueOnce(null)

    const resolved = resolveHopAsset({ ...baseParams, asset })
    const fallback = resolveHopAsset({ ...baseParams, asset })

    expect(findAssetInfoOnDest).toHaveBeenNthCalledWith(1, 'Acala', 'Astar', baseParams.currency)
    expect(findAssetInfoOnDest).toHaveBeenNthCalledWith(2, 'Acala', 'Astar', baseParams.currency)
    expect(resolved).toBe(destAsset)
    expect(fallback).toBe(asset)
  })
})
