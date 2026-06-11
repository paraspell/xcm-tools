import type { TAssetInfo, TCurrencyInputWithAmount } from '@paraspell/assets'
import { isTLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import type { TResolveHopParams, TSwapConfig } from '../../types'
import { getRelayChainOf } from '../../utils'
import { resolveHopAsset } from './resolveHopAsset'

vi.mock('@paraspell/assets')

vi.mock('@paraspell/sdk-common', async () => {
  const actual = await vi.importActual('@paraspell/sdk-common')
  return {
    ...actual,
    isTLocation: vi.fn()
  }
})

vi.mock('../../utils')

describe('resolveHopAsset', () => {
  const mockApi = {
    getTypeThenAssetCount: vi.fn(),
    findNativeAssetInfoOrThrow: vi.fn(),
    findAssetOnDestOrThrow: vi.fn(),
    findAssetInfoOnDest: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const baseParams: Omit<TResolveHopParams<unknown, unknown, unknown>, 'currentAsset'> = {
    api: mockApi,
    tx: {},
    originChain: 'Acala',
    currentChain: 'Astar',
    destination: 'Moonbeam',
    asset: { symbol: 'ORIGIN' } as TAssetInfo,
    currency: {} as TCurrencyInputWithAmount,
    hasPassedExchange: false
  }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(mockApi, 'getTypeThenAssetCount').mockReturnValue(1)
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
  })

  it('returns the relay native asset when the hop asset reserves are external', () => {
    const relayAsset = { symbol: 'KSM' } as TAssetInfo
    vi.mocked(getRelayChainOf).mockReturnValue('Kusama')
    const findNativeSpy = vi
      .spyOn(mockApi, 'findNativeAssetInfoOrThrow')
      .mockReturnValue(relayAsset)

    const currentAsset = { symbol: 'DOT' } as TAssetInfo

    const result = resolveHopAsset({ ...baseParams, currentAsset, destination: 'Ethereum' })

    expect(getRelayChainOf).toHaveBeenCalledWith(baseParams.currentChain)
    expect(findNativeSpy).toHaveBeenCalledWith('Kusama')
    expect(result).toBe(relayAsset)
  })

  it('returns the relay native asset when the TypeAndThen transfer includes relay fee asset', () => {
    const spy = vi.spyOn(mockApi, 'getTypeThenAssetCount').mockReturnValue(2)
    const relayAsset = { symbol: 'DOT' } as TAssetInfo
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.spyOn(mockApi, 'findNativeAssetInfoOrThrow').mockReturnValue(relayAsset)

    const currentAsset = { symbol: 'DOT' } as TAssetInfo

    const result = resolveHopAsset({ ...baseParams, currentAsset })

    expect(spy).toHaveBeenCalledWith(baseParams.tx)
    expect(result).toBe(relayAsset)
  })

  it('returns the post-swap asset when swap has been performed and the hop is not on the exchange chain', () => {
    const expectedAsset = { symbol: 'USDT' } as TAssetInfo
    const swapConfig: TSwapConfig = {
      exchangeChain: 'Astar',
      currencyTo: { symbol: 'USDT' }
    }

    const findAssetOnDestSpy = vi
      .spyOn(mockApi, 'findAssetOnDestOrThrow')
      .mockReturnValue(expectedAsset)

    const currentAsset = { symbol: 'DOT' } as TAssetInfo

    const result = resolveHopAsset({
      ...baseParams,
      currentAsset,
      hasPassedExchange: true,
      swapConfig,
      currentChain: 'Moonbeam'
    })

    expect(findAssetOnDestSpy).toHaveBeenCalledWith(
      swapConfig.exchangeChain,
      'Moonbeam',
      swapConfig.currencyTo
    )
    expect(result).toBe(expectedAsset)
  })

  it('returns asset info on destination or falls back to the current asset', () => {
    const currentAsset = { symbol: 'DOT' } as TAssetInfo
    const destAsset = { symbol: 'DOT' } as TAssetInfo

    const findAssetOnDestInfoSpy = vi
      .spyOn(mockApi, 'findAssetInfoOnDest')
      .mockReturnValueOnce(destAsset)
      .mockReturnValueOnce(null)

    const resolved = resolveHopAsset({ ...baseParams, currentAsset })
    const fallback = resolveHopAsset({ ...baseParams, currentAsset })

    expect(findAssetOnDestInfoSpy).toHaveBeenNthCalledWith(
      1,
      'Acala',
      'Astar',
      baseParams.currency,
      baseParams.asset
    )
    expect(findAssetOnDestInfoSpy).toHaveBeenNthCalledWith(
      2,
      'Acala',
      'Astar',
      baseParams.currency,
      baseParams.asset
    )
    expect(resolved).toBe(destAsset)
    expect(fallback).toBe(currentAsset)
  })
})
