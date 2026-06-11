import type { TAssetInfo, TSingleCurrencyInputWithAmount } from '@paraspell/assets'
import type { TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import type { BuildHopInfoOptions } from '../../types'
import { buildHopInfo } from './buildHopInfo'

const mkSpies = (api: PolkadotApi<unknown, unknown, unknown>) => ({
  findNativeAssetInfoOrThrow: vi.spyOn(api, 'findNativeAssetInfoOrThrow'),
  findAssetOnDestOrThrow: vi.spyOn(api, 'findAssetOnDestOrThrow')
})

describe('buildHopInfo', () => {
  let mockApi: PolkadotApi<unknown, unknown, unknown>
  let mockHopApi: PolkadotApi<unknown, unknown, unknown>
  let baseOptions: BuildHopInfoOptions<unknown, unknown, unknown>
  let spies: ReturnType<typeof mkSpies>

  const DEFAULT_HOP_FEE = 100000000n

  beforeEach(() => {
    vi.clearAllMocks()

    mockHopApi = {
      init: vi.fn().mockResolvedValue(undefined),
      disconnectAllowed: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined)
    } as unknown as PolkadotApi<unknown, unknown, unknown>

    mockApi = {
      clone: vi.fn().mockReturnValue(mockHopApi),
      findNativeAssetInfoOrThrow: vi.fn(),
      findAssetOnDestOrThrow: vi.fn()
    } as unknown as PolkadotApi<unknown, unknown, unknown>

    baseOptions = {
      api: mockApi,
      chain: 'AssetHubPolkadot',
      fee: DEFAULT_HOP_FEE,
      originChain: 'Polkadot',
      currency: {
        symbol: 'USDT',
        assetId: '1984',
        type: 'ASSET_HUB',
        amount: 1000n
      } as TSingleCurrencyInputWithAmount,
      asset: { symbol: 'USDT', assetId: '1984', decimals: 6 } as TAssetInfo,
      sender: 'senderAlice',
      ahAddress: 'ahBobForEvm'
    }

    spies = mkSpies(mockApi)
    spies.findNativeAssetInfoOrThrow.mockImplementation(chain => {
      if (chain.includes('Polkadot')) return { symbol: 'DOT' } as TAssetInfo
      if (chain.includes('Kusama')) return { symbol: 'KSM' } as TAssetInfo
      return { symbol: 'HOPNATIVE' } as TAssetInfo
    })
    spies.findAssetOnDestOrThrow.mockReturnValue({
      symbol: 'USDT',
      assetId: '1984',
      decimals: 6,
      location: {} as TLocation
    })
  })

  it('should successfully build info for an AssetHub-like hop chain (non-EVM origin)', async () => {
    const options = { ...baseOptions }

    const cloneSpy = vi.spyOn(mockApi, 'clone')
    const initSpy = vi.spyOn(mockHopApi, 'init')
    const setDisconnectAllowedSpy = vi.spyOn(mockHopApi, 'disconnectAllowed', 'set')
    const disconnectSpy = vi.spyOn(mockHopApi, 'disconnect')

    const result = await buildHopInfo(options)

    expect(cloneSpy).toHaveBeenCalledTimes(1)
    expect(initSpy).toHaveBeenCalledWith(options.chain)
    expect(setDisconnectAllowedSpy).toHaveBeenCalledWith(false)
    expect(spies.findAssetOnDestOrThrow).toHaveBeenCalledWith(
      options.originChain,
      options.chain,
      options.currency
    )

    expect(result).toEqual({
      asset: {
        symbol: 'USDT',
        assetId: '1984',
        decimals: 6,
        location: {}
      },
      xcmFee: {
        fee: DEFAULT_HOP_FEE,
        asset: { symbol: 'USDT', assetId: '1984', decimals: 6 }
      }
    })
    expect(setDisconnectAllowedSpy).toHaveBeenLastCalledWith(true)
    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })

  it('should correctly build info for a BridgeHub hop chain', async () => {
    const chain: TSubstrateChain = 'BridgeHubPolkadot'
    const options = { ...baseOptions, chain }

    const initSpy = vi.spyOn(mockHopApi, 'init')
    const setDisconnectAllowedSpy = vi.spyOn(mockHopApi, 'disconnectAllowed', 'set')
    const disconnectSpy = vi.spyOn(mockHopApi, 'disconnect')

    const result = await buildHopInfo(options)

    expect(initSpy).toHaveBeenCalledWith(chain)
    expect(spies.findNativeAssetInfoOrThrow).toHaveBeenCalledWith(chain)
    expect(spies.findAssetOnDestOrThrow).not.toHaveBeenCalled()

    expect(result).toEqual({
      asset: {
        symbol: 'DOT'
      },
      xcmFee: {
        fee: DEFAULT_HOP_FEE,
        asset: {
          symbol: 'USDT',
          assetId: '1984',
          decimals: 6
        }
      }
    })
    expect(setDisconnectAllowedSpy).toHaveBeenLastCalledWith(true)
    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })

  it('should return the resolved hop asset for a non-BridgeHub chain', async () => {
    const asset: TAssetInfo = {
      symbol: 'OTHER',
      assetId: 'otherId',
      decimals: 12,
      location: {
        parents: 1,
        interior: 'Here'
      }
    }
    spies.findAssetOnDestOrThrow.mockReturnValue(asset)
    const options = { ...baseOptions }

    const result = await buildHopInfo(options)

    expect(spies.findAssetOnDestOrThrow).toHaveBeenCalledWith(
      options.originChain,
      options.chain,
      options.currency
    )
    expect(result).toEqual({
      asset,
      xcmFee: {
        fee: DEFAULT_HOP_FEE,
        asset: baseOptions.asset
      }
    })
  })

  it('should call finally block (disconnect) even if an earlier call fails', async () => {
    spies.findAssetOnDestOrThrow.mockImplementation(() => {
      throw new Error('Network error')
    })
    const options = { ...baseOptions }

    const disconnectAllowedSpy = vi.spyOn(mockHopApi, 'disconnectAllowed', 'set')
    const disconnectSpy = vi.spyOn(mockHopApi, 'disconnect')

    await expect(buildHopInfo(options)).rejects.toThrow('Network error')

    expect(disconnectAllowedSpy).toHaveBeenCalledTimes(2)
    expect(disconnectAllowedSpy).toHaveBeenLastCalledWith(true)
    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })
})
