import type { TAssetInfo, TCurrencyCore } from '@paraspell/assets'
import {
  findAssetOnDestOrThrow,
  getExistentialDeposit,
  getNativeAssetSymbol,
  isChainEvm
} from '@paraspell/assets'
import type { TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { InvalidParameterError } from '../../errors'
import { getAssetBalanceInternal, getBalanceNativeInternal } from '../../pallets/assets/balance'
import type { BuildHopInfoOptions } from '../../types'
import { buildHopInfo } from './buildHopInfo'

vi.mock('@paraspell/assets', async () => {
  const actual = await import('@paraspell/assets')
  return {
    ...actual,
    findAssetOnDestOrThrow: vi.fn(),
    getExistentialDeposit: vi.fn(),
    getNativeAssetSymbol: vi.fn(),
    isChainEvm: vi.fn()
  }
})

vi.mock('../../../errors', () => ({
  InvalidParameterError: class extends Error {}
}))

vi.mock('../balance')
vi.mock('../../pallets/assets/balance')

describe('buildHopInfo', () => {
  let mockApi: IPolkadotApi<unknown, unknown>
  let mockHopApi: IPolkadotApi<unknown, unknown>
  let baseOptions: BuildHopInfoOptions<unknown, unknown>

  const DEFAULT_NATIVE_BALANCE = 100000000000n
  const DEFAULT_ASSET_BALANCE = 5000000000n
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

    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(DEFAULT_NATIVE_BALANCE)
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
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(DEFAULT_ASSET_BALANCE)
    vi.mocked(getExistentialDeposit).mockReturnValue(DEFAULT_ED)
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
    expect(isChainEvm).toHaveBeenCalledWith(options.originChain)
    expect(getBalanceNativeInternal).toHaveBeenCalledWith({
      api: mockHopApi,
      address: options.senderAddress,
      chain: options.chain
    })
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(options.chain)
    expect(findAssetOnDestOrThrow).toHaveBeenCalledWith(
      options.originChain,
      options.chain,
      options.currency
    )
    expect(getAssetBalanceInternal).toHaveBeenCalledWith({
      api: mockHopApi,
      address: options.senderAddress,
      chain: options.chain,
      currency: {
        location: (vi.mocked(findAssetOnDestOrThrow).mock.results[0].value as TAssetInfo).location
      }
    })
    expect(getExistentialDeposit).toHaveBeenCalledWith(options.chain, {
      location: (vi.mocked(findAssetOnDestOrThrow).mock.results[0].value as TAssetInfo).location
    })

    expect(result).toEqual({
      balance: DEFAULT_ASSET_BALANCE,
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
        balance: DEFAULT_NATIVE_BALANCE,
        currencySymbol: 'DOT',
        asset: { symbol: 'USDT', assetId: '1984', decimals: 6 }
      }
    })
    expect(setDisconnectAllowedSpy).toHaveBeenLastCalledWith(true)
    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })

  it('should use ahAddress for EVM origin if provided', async () => {
    vi.mocked(isChainEvm).mockReturnValue(true)
    const options = { ...baseOptions, originChain: 'Moonbeam' as TSubstrateChain }
    await buildHopInfo(options)

    expect(getBalanceNativeInternal).toHaveBeenCalledWith(
      expect.objectContaining({ address: options.ahAddress })
    )
    expect(getAssetBalanceInternal).toHaveBeenCalledWith(
      expect.objectContaining({ address: options.ahAddress })
    )
  })

  it('should use senderAddress for EVM origin if ahAddress is NOT provided', async () => {
    vi.mocked(isChainEvm).mockReturnValue(true)
    const options = {
      ...baseOptions,
      originChain: 'Moonbeam' as TSubstrateChain,
      ahAddress: undefined
    }
    await buildHopInfo(options)

    expect(getBalanceNativeInternal).toHaveBeenCalledWith(
      expect.objectContaining({ address: options.senderAddress })
    )
    expect(getAssetBalanceInternal).toHaveBeenCalledWith(
      expect.objectContaining({ address: options.senderAddress })
    )
  })

  it('should correctly build info for a BridgeHub hop chain', async () => {
    const chain: TSubstrateChain = 'BridgeHubPolkadot'
    const options = { ...baseOptions, chain }

    const initSpy = vi.spyOn(mockHopApi, 'init')
    const setDisconnectAllowedSpy = vi.spyOn(mockHopApi, 'setDisconnectAllowed')
    const disconnectSpy = vi.spyOn(mockHopApi, 'disconnect')

    const result = await buildHopInfo(options)

    expect(initSpy).toHaveBeenCalledWith(chain)
    expect(getBalanceNativeInternal).toHaveBeenCalledWith({
      api: mockHopApi,
      address: options.senderAddress,
      chain
    })
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(chain)
    expect(findAssetOnDestOrThrow).not.toHaveBeenCalled()
    expect(getAssetBalanceInternal).not.toHaveBeenCalled()
    expect(getExistentialDeposit).not.toHaveBeenCalled()

    expect(result).toEqual({
      currencySymbol: 'DOT',
      xcmFee: {
        fee: DEFAULT_HOP_FEE,
        balance: DEFAULT_NATIVE_BALANCE,
        currencySymbol: 'DOT',
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
    vi.mocked(getExistentialDeposit).mockReturnValue(null)
    const options = { ...baseOptions }

    const disconnectAllowedSpy = vi.spyOn(mockHopApi, 'setDisconnectAllowed')
    const disconnectSpy = vi.spyOn(mockHopApi, 'disconnect')

    await expect(buildHopInfo(options)).rejects.toThrow(InvalidParameterError)
    const hopAsset = vi.mocked(findAssetOnDestOrThrow).mock.results[0].value as TAssetInfo
    const expectedPayload = hopAsset.location
      ? { location: hopAsset.location }
      : { symbol: hopAsset.symbol }
    await expect(buildHopInfo(options)).rejects.toThrow(
      `Existential deposit not found for chain ${options.chain} with currency ${JSON.stringify(expectedPayload)}`
    )

    expect(disconnectAllowedSpy).toHaveBeenCalledTimes(4)
    expect(disconnectAllowedSpy).toHaveBeenLastCalledWith(true)
    expect(disconnectSpy).toHaveBeenCalledTimes(2)
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
    expect(getAssetBalanceInternal).toHaveBeenCalledWith(
      expect.objectContaining({ currency: expectedCurrencyPayload })
    )
    expect(getExistentialDeposit).toHaveBeenCalledWith(options.chain, expectedCurrencyPayload)
  })

  it('should call finally block (disconnect) even if an earlier async call fails', async () => {
    vi.mocked(getBalanceNativeInternal).mockRejectedValueOnce(new Error('Network error'))
    const options = { ...baseOptions }

    const disconnectAllowedSpy = vi.spyOn(mockHopApi, 'setDisconnectAllowed')
    const disconnectSpy = vi.spyOn(mockHopApi, 'disconnect')

    await expect(buildHopInfo(options)).rejects.toThrow('Network error')

    expect(disconnectAllowedSpy).toHaveBeenCalledTimes(2)
    expect(disconnectAllowedSpy).toHaveBeenLastCalledWith(true)
    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })
})
