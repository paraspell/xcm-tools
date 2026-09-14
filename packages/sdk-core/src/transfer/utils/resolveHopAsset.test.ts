import { isAssetEqual, type TAssetInfo, type TCurrencyInputWithAmount } from '@paraspell/assets'
import { isTLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { RELAY_LOCATION } from '../../constants'
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
    getRelayChainOf: vi.fn(),
    localizeLocation: vi.fn(),
    findNativeAssetInfoOrThrow: vi.fn(),
    findAssetInfoOrThrow: vi.fn(),
    findAssetOnDestOrThrow: vi.fn(),
    findAssetInfoOnDest: vi.fn()
  } as unknown as PolkadotApi<unknown, unknown, unknown>

  const baseParams: Omit<TResolveHopParams<unknown, unknown, unknown>, 'currentAsset'> = {
    api: mockApi,
    tx: {},
    originChain: 'Acala',
    currentChain: 'Astar',
    destination: 'Darwinia',
    asset: { symbol: 'ORIGIN' } as TAssetInfo,
    currency: {} as TCurrencyInputWithAmount,
    hasPassedExchange: false
  }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(mockApi, 'getTypeThenAssetCount').mockReturnValue(1)
    vi.mocked(isTLocation).mockReturnValue(false)
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.spyOn(mockApi, 'getRelayChainOf').mockReturnValue('Polkadot')
  })

  it('returns the relay native asset when the hop asset reserves are external', () => {
    const relayAsset = { symbol: 'KSM' } as TAssetInfo
    vi.mocked(getRelayChainOf).mockReturnValue('Kusama')
    vi.spyOn(mockApi, 'getRelayChainOf').mockReturnValue('Kusama')
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

  it('returns the origin relay asset registered on the hop chain when the hop is on another relay', () => {
    vi.spyOn(mockApi, 'getTypeThenAssetCount').mockReturnValue(2)
    vi.spyOn(mockApi, 'getRelayChainOf').mockReturnValue('Kusama')
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    const location = { parents: 2, interior: { X1: [{ GlobalConsensus: { kusama: null } }] } }
    const localizeSpy = vi.spyOn(mockApi, 'localizeLocation').mockReturnValue(location)
    const bridgedRelayAsset = { symbol: 'KSM', location } as TAssetInfo
    const findSpy = vi.spyOn(mockApi, 'findAssetInfoOrThrow').mockReturnValue(bridgedRelayAsset)
    const findNativeSpy = vi.spyOn(mockApi, 'findNativeAssetInfoOrThrow')

    const result = resolveHopAsset({
      ...baseParams,
      originChain: 'AssetHubKusama',
      currentChain: 'AssetHubPolkadot',
      destination: 'AssetHubPolkadot',
      currentAsset: { symbol: 'DOT' } as TAssetInfo
    })

    expect(localizeSpy).toHaveBeenCalledWith('AssetHubPolkadot', RELAY_LOCATION, 'AssetHubKusama')
    expect(findSpy).toHaveBeenCalledWith('AssetHubPolkadot', { location })
    expect(findNativeSpy).not.toHaveBeenCalled()
    expect(result).toBe(bridgedRelayAsset)
  })

  describe('fee asset', () => {
    const feeAsset = { symbol: 'USDC', location: { parents: 1, interior: 'Here' } } as TAssetInfo
    const currentAsset = { symbol: 'DOT' } as TAssetInfo

    it('returns the fee asset registered on the hop chain when a separate fee asset pays hop fees', () => {
      const hopFeeAsset = { symbol: 'USDC' } as TAssetInfo
      vi.mocked(isAssetEqual).mockReturnValue(false)
      const findInfoSpy = vi.spyOn(mockApi, 'findAssetInfoOnDest').mockReturnValue(hopFeeAsset)

      const result = resolveHopAsset({ ...baseParams, currentAsset, feeAsset })

      expect(isAssetEqual).toHaveBeenCalledWith(baseParams.asset, feeAsset)
      expect(findInfoSpy).toHaveBeenCalledWith(
        'Acala',
        'Astar',
        { location: feeAsset.location },
        feeAsset
      )
      expect(result).toBe(hopFeeAsset)
    })

    it('falls back to the origin fee asset when the hop chain does not register it', () => {
      vi.mocked(isAssetEqual).mockReturnValue(false)
      vi.spyOn(mockApi, 'findAssetInfoOnDest').mockReturnValue(null)

      const result = resolveHopAsset({ ...baseParams, currentAsset, feeAsset })

      expect(result).toBe(feeAsset)
    })

    it('takes precedence over the relay asset included in a TypeAndThen transfer', () => {
      vi.spyOn(mockApi, 'getTypeThenAssetCount').mockReturnValue(2)
      vi.mocked(isAssetEqual).mockReturnValue(false)
      const hopFeeAsset = { symbol: 'USDC' } as TAssetInfo
      const findInfoSpy = vi.spyOn(mockApi, 'findAssetInfoOnDest').mockReturnValue(hopFeeAsset)
      const findNativeSpy = vi.spyOn(mockApi, 'findNativeAssetInfoOrThrow')

      const result = resolveHopAsset({ ...baseParams, currentAsset, feeAsset })

      expect(findNativeSpy).not.toHaveBeenCalled()
      expect(findInfoSpy).toHaveBeenCalledWith(
        'Acala',
        'Astar',
        { location: feeAsset.location },
        feeAsset
      )
      expect(result).toBe(hopFeeAsset)
    })

    it('ignores the fee asset when it equals the transferred asset', () => {
      vi.mocked(isAssetEqual).mockReturnValue(true)
      const findInfoSpy = vi.spyOn(mockApi, 'findAssetInfoOnDest').mockReturnValue(null)

      const result = resolveHopAsset({ ...baseParams, currentAsset, feeAsset })

      expect(findInfoSpy).toHaveBeenCalledWith(
        'Acala',
        'Astar',
        baseParams.currency,
        baseParams.asset
      )
      expect(result).toBe(currentAsset)
    })

    it('takes precedence over the post-swap asset for swap transfers', () => {
      vi.mocked(isAssetEqual).mockReturnValue(false)
      const hopFeeAsset = { symbol: 'USDC' } as TAssetInfo
      const findInfoSpy = vi.spyOn(mockApi, 'findAssetInfoOnDest').mockReturnValue(hopFeeAsset)
      const findOnDestSpy = vi.spyOn(mockApi, 'findAssetOnDestOrThrow')
      const swapConfig: TSwapConfig = { exchangeChain: 'Astar', currencyTo: { symbol: 'USDT' } }

      const result = resolveHopAsset({
        ...baseParams,
        currentChain: 'Darwinia',
        currentAsset,
        feeAsset,
        swapConfig,
        hasPassedExchange: true
      })

      expect(findOnDestSpy).not.toHaveBeenCalled()
      expect(findInfoSpy).toHaveBeenCalledWith(
        'Acala',
        'Darwinia',
        { location: feeAsset.location },
        feeAsset
      )
      expect(result).toBe(hopFeeAsset)
    })
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
      currentChain: 'Darwinia'
    })

    expect(findAssetOnDestSpy).toHaveBeenCalledWith(
      swapConfig.exchangeChain,
      'Darwinia',
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
