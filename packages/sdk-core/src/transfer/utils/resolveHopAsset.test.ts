import type { TAssetInfo, TCurrencyCore, TCurrencyInputWithAmount } from '@paraspell/assets'
import {
  findAssetInfoOnDest,
  findAssetOnDestOrThrow,
  findNativeAssetInfoOrThrow
} from '@paraspell/assets'
import { Parents } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TResolveHopParams, TSwapConfig } from '../../types'
import { getRelayChainOf } from '../../utils'
import { resolveHopAsset } from './resolveHopAsset'

vi.mock('@paraspell/assets')

vi.mock('../../utils')

describe('resolveHopAsset', () => {
  const baseParams: Omit<TResolveHopParams, 'asset'> = {
    originChain: 'Acala',
    currentChain: 'Astar',
    currency: {} as TCurrencyInputWithAmount,
    hasPassedExchange: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
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
