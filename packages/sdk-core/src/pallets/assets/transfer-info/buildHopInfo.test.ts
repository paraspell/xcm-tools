/* eslint-disable @typescript-eslint/unbound-method */
import type { TAssetInfo, TCurrencyCore } from '@paraspell/assets'
import {
  findAssetOnDestOrThrow,
  getExistentialDeposit,
  getNativeAssetSymbol,
  isNodeEvm
} from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api'
import { InvalidParameterError } from '../../../errors'
import { getAssetBalanceInternal, getBalanceNativeInternal } from '../balance'
import type { BuildHopInfoOptions } from './buildHopInfo'
import { buildHopInfo } from './buildHopInfo'

vi.mock('@paraspell/assets', async () => {
  const actual = await import('@paraspell/assets')
  return {
    ...actual,
    findAssetOnDestOrThrow: vi.fn(),
    getExistentialDeposit: vi.fn(),
    getNativeAssetSymbol: vi.fn(),
    isNodeEvm: vi.fn()
  }
})

vi.mock('../../../errors', () => ({
  InvalidParameterError: class extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'InvalidParameterError'
    }
  }
}))

vi.mock('../balance', () => ({
  getAssetBalanceInternal: vi.fn(),
  getBalanceNativeInternal: vi.fn()
}))

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
      node: 'AssetHubPolkadot' as TNodeDotKsmWithRelayChains,
      feeData: {
        fee: DEFAULT_HOP_FEE,
        currency: 'DOT'
      },
      originNode: 'Polkadot' as TNodeDotKsmWithRelayChains,
      currency: { symbol: 'USDT', assetId: '1984', type: 'ASSET_HUB' } as TCurrencyCore,
      senderAddress: 'senderAlice',
      ahAddress: 'ahBobForEvm'
    }

    vi.mocked(isNodeEvm).mockReturnValue(false)
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(DEFAULT_NATIVE_BALANCE)
    vi.mocked(getNativeAssetSymbol).mockImplementation(node => {
      if (node.includes('Polkadot')) return 'DOT'
      if (node.includes('Kusama')) return 'KSM'
      return 'HOPNATIVE'
    })
    vi.mocked(findAssetOnDestOrThrow).mockReturnValue({
      symbol: 'USDT',
      assetId: '1984',
      decimals: 6,
      location: {
        parents: 0,
        interior: { X2: [{ PalletInstance: 50 }, { GeneralIndex: 1984 }] }
      }
    } as TAssetInfo)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(DEFAULT_ASSET_BALANCE)
    vi.mocked(getExistentialDeposit).mockReturnValue(DEFAULT_ED)
  })

  it('should successfully build info for an AssetHub-like hop node (non-EVM origin)', async () => {
    const options = { ...baseOptions }
    const result = await buildHopInfo(options)

    expect(mockApi.clone).toHaveBeenCalledTimes(1)
    expect(mockHopApi.init).toHaveBeenCalledWith(options.node)
    expect(mockHopApi.setDisconnectAllowed).toHaveBeenCalledWith(false)
    expect(isNodeEvm).toHaveBeenCalledWith(options.originNode)
    expect(getBalanceNativeInternal).toHaveBeenCalledWith({
      api: mockHopApi,
      address: options.senderAddress,
      node: options.node
    })
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(options.node)
    expect(findAssetOnDestOrThrow).toHaveBeenCalledWith(
      options.originNode,
      options.node,
      options.currency
    )
    expect(getAssetBalanceInternal).toHaveBeenCalledWith({
      api: mockHopApi,
      address: options.senderAddress,
      node: options.node,
      currency: {
        location: (vi.mocked(findAssetOnDestOrThrow).mock.results[0].value as TAssetInfo).location
      }
    })
    expect(getExistentialDeposit).toHaveBeenCalledWith(options.node, {
      location: (vi.mocked(findAssetOnDestOrThrow).mock.results[0].value as TAssetInfo).location
    })

    expect(result).toEqual({
      balance: DEFAULT_ASSET_BALANCE,
      currencySymbol: 'USDT',
      existentialDeposit: BigInt(DEFAULT_ED),
      xcmFee: {
        fee: DEFAULT_HOP_FEE,
        balance: DEFAULT_NATIVE_BALANCE,
        currencySymbol: 'DOT'
      }
    })
    expect(mockHopApi.setDisconnectAllowed).toHaveBeenLastCalledWith(true)
    expect(mockHopApi.disconnect).toHaveBeenCalledTimes(1)
  })

  it('should use ahAddress for EVM origin if provided', async () => {
    vi.mocked(isNodeEvm).mockReturnValue(true)
    const options = { ...baseOptions, originNode: 'Moonbeam' as TNodeDotKsmWithRelayChains }
    await buildHopInfo(options)

    expect(getBalanceNativeInternal).toHaveBeenCalledWith(
      expect.objectContaining({ address: options.ahAddress })
    )
    expect(getAssetBalanceInternal).toHaveBeenCalledWith(
      expect.objectContaining({ address: options.ahAddress })
    )
  })

  it('should use senderAddress for EVM origin if ahAddress is NOT provided', async () => {
    vi.mocked(isNodeEvm).mockReturnValue(true)
    const options = {
      ...baseOptions,
      originNode: 'Moonbeam' as TNodeDotKsmWithRelayChains,
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

  it('should correctly build info for a BridgeHub hop node', async () => {
    const bridgeHubNode = 'BridgeHubPolkadot' as TNodeDotKsmWithRelayChains
    const options = { ...baseOptions, node: bridgeHubNode }
    const result = await buildHopInfo(options)

    expect(mockHopApi.init).toHaveBeenCalledWith(bridgeHubNode)
    expect(getBalanceNativeInternal).toHaveBeenCalledWith({
      api: mockHopApi,
      address: options.senderAddress,
      node: bridgeHubNode
    })
    expect(getNativeAssetSymbol).toHaveBeenCalledWith(bridgeHubNode)
    expect(findAssetOnDestOrThrow).not.toHaveBeenCalled()
    expect(getAssetBalanceInternal).not.toHaveBeenCalled()
    expect(getExistentialDeposit).not.toHaveBeenCalled()

    expect(result).toEqual({
      currencySymbol: 'DOT',
      xcmFee: {
        fee: DEFAULT_HOP_FEE,
        balance: DEFAULT_NATIVE_BALANCE,
        currencySymbol: 'DOT'
      }
    })
    expect(mockHopApi.setDisconnectAllowed).toHaveBeenLastCalledWith(true)
    expect(mockHopApi.disconnect).toHaveBeenCalledTimes(1)
  })

  it('should throw InvalidParameterError if ED is not found for AssetHub-like node', async () => {
    vi.mocked(getExistentialDeposit).mockReturnValue(null)
    const options = { ...baseOptions }

    await expect(buildHopInfo(options)).rejects.toThrow(InvalidParameterError)
    const hopAsset = vi.mocked(findAssetOnDestOrThrow).mock.results[0].value as TAssetInfo
    const expectedPayload = hopAsset.location
      ? { location: hopAsset.location }
      : { symbol: hopAsset.symbol }
    await expect(buildHopInfo(options)).rejects.toThrow(
      `Existential deposit not found for node ${options.node} with currency ${JSON.stringify(expectedPayload)}`
    )

    expect(mockHopApi.setDisconnectAllowed).toHaveBeenCalledTimes(4)
    expect(mockHopApi.setDisconnectAllowed).toHaveBeenLastCalledWith(true)
    expect(mockHopApi.disconnect).toHaveBeenCalledTimes(2)
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
    expect(getExistentialDeposit).toHaveBeenCalledWith(options.node, expectedCurrencyPayload)
  })

  it('should call finally block (disconnect) even if an earlier async call fails', async () => {
    vi.mocked(getBalanceNativeInternal).mockRejectedValueOnce(new Error('Network error'))
    const options = { ...baseOptions }

    await expect(buildHopInfo(options)).rejects.toThrow('Network error')

    expect(mockHopApi.setDisconnectAllowed).toHaveBeenCalledTimes(2)
    expect(mockHopApi.setDisconnectAllowed).toHaveBeenLastCalledWith(true)
    expect(mockHopApi.disconnect).toHaveBeenCalledTimes(1)
  })
})
