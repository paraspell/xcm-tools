import type { TAssetInfo, TCurrencyCore } from '@paraspell/assets'
import {
  findAssetOnDestOrThrow,
  getExistentialDepositOrThrow,
  getNativeAssetSymbol
} from '@paraspell/assets'
import type { TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { InvalidParameterError } from '../../errors'
import type { BuildHopInfoOptions } from '../../types'
import { buildHopInfo } from './buildHopInfo'

vi.mock('@paraspell/assets', async () => {
  const actual = await import('@paraspell/assets')
  return {
    ...actual,
    findAssetOnDestOrThrow: vi.fn(),
    getExistentialDepositOrThrow: vi.fn(),
    getNativeAssetSymbol: vi.fn()
  }
})

vi.mock('../../../errors', () => ({
  InvalidParameterError: class extends Error {}
}))

describe('buildHopInfo', () => {
  let mockApi: IPolkadotApi<unknown, unknown>
  let mockHopApi: IPolkadotApi<unknown, unknown>
  let baseOptions: BuildHopInfoOptions<unknown, unknown>

  const DEFAULT_HOP_FEE = 100000000n
  const DEFAULT_ED = 100000000n

  beforeEach(() => {
    vi.clearAllMocks()

    mockHopApi = {
      init: vi.fn().mockResolvedValue(undefined),
      setDisconnectAllowed: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined)
    } as unknown as IPolkadotApi<unknown, unknown>

    mockApi = {
      clone: vi.fn().mockReturnValue(mockHopApi)
    } as unknown as IPolkadotApi<unknown, unknown>

    baseOptions = {
      api: mockApi,
      chain: 'AssetHubPolkadot' as TSubstrateChain,
      feeData: {
        fee: DEFAULT_HOP_FEE,
        currency: 'DOT'
      },
      originChain: 'Polkadot' as TSubstrateChain,
      currency: { symbol: 'USDT', assetId: '1984', type: 'ASSET_HUB' } as TCurrencyCore,
      asset: { symbol: 'USDT', assetId: '1984', decimals: 6 } as TAssetInfo,
      senderAddress: 'senderAlice',
      ahAddress: 'ahBobForEvm'
    }

    vi.mocked(getNativeAssetSymbol).mockImplementation(chain => {
      if (chain.includes('Polkadot')) return 'DOT'
      if (chain.includes('Kusama')) return 'KSM'
      return 'HOPNATIVE'
    })
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
      symbol: 'USDT',
      assetId: '1984',
      decimals: 6,
      location: {} as TLocation
    } as TAssetInfo)
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(DEFAULT_ED)
  })

  it('should successfully build info for an AssetHub-like hop chain (non-EVM origin)', async () => {
    const options = { ...baseOptions }

    const cloneSpy = vi.spyOn(mockApi, 'clone')
    const initSpy = vi.spyOn(mockHopApi, 'init')
    const setDisconnectAllowedSpy = vi.spyOn(mockHopApi, 'setDisconnectAllowed')
    const disconnectSpy = vi.spyOn(mockHopApi, 'disconnect')

    const result = await buildHopInfo(options)

    expect(cloneSpy).toHaveBeenCalledTimes(1)
    expect(initSpy).toHaveBeenCalledWith(options.chain)
    expect(setDisconnectAllowedSpy).toHaveBeenCalledWith(false)
    expect(findAssetOnDestOrThrow).toHaveBeenCalledWith(
      options.originChain,
      options.chain,
      options.currency
    )

    expect(getExistentialDepositOrThrow).toHaveBeenCalledWith(options.chain, {
      location: (vi.mocked(findAssetOnDestOrThrow).mock.results[0].value as TAssetInfo).location
    })

    expect(result).toEqual({
      currencySymbol: 'USDT',
      asset: {
        symbol: 'USDT',
        assetId: '1984',
        decimals: 6,
        location: {}
      },
      existentialDeposit: BigInt(DEFAULT_ED),
      xcmFee: {
        fee: DEFAULT_HOP_FEE,
        currencySymbol: 'USDT',
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
    const setDisconnectAllowedSpy = vi.spyOn(mockHopApi, 'setDisconnectAllowed')
    const disconnectSpy = vi.spyOn(mockHopApi, 'disconnect')

    const result = await buildHopInfo(options)

    expect(initSpy).toHaveBeenCalledWith(chain)
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(chain)
    expect(findAssetOnDestOrThrow).not.toHaveBeenCalled()
    expect(getExistentialDepositOrThrow).not.toHaveBeenCalled()

    expect(result).toEqual({
      currencySymbol: 'DOT',
      xcmFee: {
        fee: DEFAULT_HOP_FEE,
        currencySymbol: 'USDT',
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

  it('should throw InvalidParameterError if ED is not found for AssetHub-like chain', async () => {
    vi.mocked(getExistentialDepositOrThrow).mockImplementation(() => {
      throw new InvalidParameterError('Existential deposit not found')
    })
    const options = { ...baseOptions }

    const disconnectAllowedSpy = vi.spyOn(mockHopApi, 'setDisconnectAllowed')
    const disconnectSpy = vi.spyOn(mockHopApi, 'disconnect')

    await expect(buildHopInfo(options)).rejects.toThrow(InvalidParameterError)

    expect(disconnectAllowedSpy).toHaveBeenCalledTimes(2)
    expect(disconnectAllowedSpy).toHaveBeenLastCalledWith(true)
    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })

  it('should handle hop asset without location correctly', async () => {
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
      symbol: 'OTHER',
      assetId: 'otherId',
      decimals: 12
    } as TAssetInfo)
    const options = { ...baseOptions }
    await buildHopInfo(options)

    const expectedCurrencyPayload = { symbol: 'OTHER' }

    expect(getExistentialDepositOrThrow).toHaveBeenCalledWith(
      options.chain,
      expectedCurrencyPayload
    )
  })

  it('should call finally block (disconnect) even if an earlier call fails', async () => {
    vi.mocked(getExistentialDepositOrThrow).mockImplementation(() => {
      throw new Error('Network error')
    })
    const options = { ...baseOptions }

    const disconnectAllowedSpy = vi.spyOn(mockHopApi, 'setDisconnectAllowed')
    const disconnectSpy = vi.spyOn(mockHopApi, 'disconnect')

    await expect(buildHopInfo(options)).rejects.toThrow('Network error')

    expect(disconnectAllowedSpy).toHaveBeenCalledTimes(2)
    expect(disconnectAllowedSpy).toHaveBeenLastCalledWith(true)
    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })
})
