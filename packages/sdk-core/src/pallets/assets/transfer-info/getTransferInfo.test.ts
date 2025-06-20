/* eslint-disable @typescript-eslint/unbound-method */
import type { TAsset, TCurrencyCore, WithAmount } from '@paraspell/assets'
import { getExistentialDepositOrThrow } from '@paraspell/assets'
import {
  findAssetForNodeOrThrow,
  getRelayChainSymbol,
  isAssetEqual,
  isNodeEvm
} from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains, TNodeWithRelayChains } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../../api'
import { InvalidParameterError } from '../../../errors'
import { getXcmFee } from '../../../transfer'
import { resolveFeeAsset } from '../../../transfer/utils/resolveFeeAsset'
import type {
  TGetTransferInfoOptions,
  TTransferInfo,
  TXcmFeeDetail,
  TXcmFeeHopInfo
} from '../../../types'
import { determineRelayChain } from '../../../utils'
import { getAssetBalanceInternal, getBalanceNativeInternal } from '../balance'
import { buildDestInfo } from './buildDestInfo'
import { buildHopInfo } from './buildHopInfo'
import { getTransferInfo } from './getTransferInfo'

vi.mock('@paraspell/assets', async importOriginal => {
  const actual = await importOriginal<typeof import('@paraspell/assets')>()
  return {
    ...actual,
    findAssetForNodeOrThrow: vi.fn(),
    getExistentialDepositOrThrow: vi.fn(),
    getRelayChainSymbol: vi.fn(),
    isAssetEqual: vi.fn(),
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

vi.mock('../../../transfer', () => ({
  getXcmFee: vi.fn()
}))

vi.mock('../../../transfer/utils/resolveFeeAsset', () => ({
  resolveFeeAsset: vi.fn()
}))

vi.mock('../../../utils', () => ({
  determineRelayChain: vi.fn()
}))

vi.mock('../balance', () => ({
  getAssetBalanceInternal: vi.fn(),
  getBalanceNativeInternal: vi.fn()
}))

vi.mock('./buildDestInfo', () => ({
  buildDestInfo: vi.fn()
}))

vi.mock('./buildHopInfo', () => ({
  buildHopInfo: vi.fn()
}))

describe('getTransferInfo', () => {
  let mockApi: IPolkadotApi<unknown, unknown>
  let mockTx: unknown
  let baseOptions: Omit<TGetTransferInfoOptions<unknown, unknown>, 'api' | 'tx'>

  beforeEach(() => {
    vi.clearAllMocks()

    mockApi = {
      init: vi.fn().mockResolvedValue(undefined),
      setDisconnectAllowed: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined)
    } as unknown as IPolkadotApi<unknown, unknown>
    mockTx = {}

    baseOptions = {
      origin: 'Polkadot' as TNodeDotKsmWithRelayChains,
      destination: 'AssetHubPolkadot' as TNodeWithRelayChains,
      senderAddress: 'senderAlice',
      ahAddress: 'ahBob',
      address: 'receiverCharlie',
      currency: {
        symbol: 'DOT',
        amount: '10000000000',
        type: 'NATIVE'
      } as WithAmount<TCurrencyCore>,
      feeAsset: { symbol: 'DOT', type: 'NATIVE' } as TCurrencyCore
    }

    vi.mocked(isNodeEvm).mockReturnValue(false)
    vi.mocked(resolveFeeAsset).mockImplementation(feeAsset => feeAsset as TAsset)
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({
      symbol: 'DOT',
      assetId: 'DOT',
      decimals: 10
    })
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(200000000000n)
    vi.mocked(getBalanceNativeInternal).mockResolvedValue(200000000000n)
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(1000000000n)
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { fee: 100000000n, currency: 'DOT' } as TXcmFeeDetail,
      assetHub: { fee: 50000000n, currency: 'DOT' } as TXcmFeeDetail,
      bridgeHub: { fee: 60000000n, currency: 'DOT' } as TXcmFeeDetail,
      hops: [],
      destination: { fee: 70000000n, currency: 'DOT' } as TXcmFeeDetail
    })
    vi.mocked(isAssetEqual).mockReturnValue(false)
    vi.mocked(determineRelayChain).mockReturnValue('Polkadot')
    vi.mocked(getRelayChainSymbol).mockReturnValue('DOT')
    vi.mocked(buildHopInfo).mockResolvedValue({
      balance: 0n,
      currencySymbol: 'DOT',
      existentialDeposit: 0n,
      xcmFee: {
        fee: 0n,
        balance: 0n,
        currencySymbol: 'DOT'
      }
    })
    vi.mocked(buildDestInfo).mockResolvedValue({
      receivedCurrency: {
        sufficient: true,
        receivedAmount: 10000000000n,
        balance: 0n,
        balanceAfter: BigInt(baseOptions.currency.amount),
        currencySymbol: 'DOT',
        existentialDeposit: 100000000n
      },
      xcmFee: {
        fee: 70000000n,
        balanceAfter: 0n,
        balance: 0n,
        currencySymbol: 'DOT'
      }
    })
  })

  it('should successfully get transfer info for a Polkadot parachain transfer with all hops', async () => {
    const options = { ...baseOptions, api: mockApi, tx: mockTx }
    const result = await getTransferInfo(options)

    expect(mockApi.init).toHaveBeenCalledWith(options.origin)
    expect(mockApi.setDisconnectAllowed).toHaveBeenCalledWith(false)
    expect(findAssetForNodeOrThrow).toHaveBeenCalledWith(
      options.origin,
      options.currency,
      options.destination
    )
    expect(getAssetBalanceInternal).toHaveBeenCalledTimes(2)
    expect(getBalanceNativeInternal).not.toHaveBeenCalled()
    expect(getExistentialDepositOrThrow).toHaveBeenCalledWith(options.origin, options.currency)
    expect(getXcmFee).toHaveBeenCalledWith({
      api: mockApi,
      tx: mockTx,
      origin: options.origin,
      destination: options.destination,
      senderAddress: options.senderAddress,
      address: options.address,
      currency: options.currency,
      feeAsset: options.feeAsset,
      disableFallback: false
    })
    expect(buildHopInfo).toHaveBeenCalledTimes(2) // AssetHub and BridgeHub
    expect(buildDestInfo).toHaveBeenCalled()
    expect(mockApi.setDisconnectAllowed).toHaveBeenCalledWith(true)
    expect(mockApi.disconnect).toHaveBeenCalled()

    expect(result.chain.origin).toBe(options.origin)
    expect(result.chain.destination).toBe(options.destination)
    expect(result.chain.ecosystem).toBe('DOT')
    expect(result.origin.selectedCurrency.currencySymbol).toBe('DOT')
    expect(result.origin.selectedCurrency.balance).toBe(200000000000n)
    expect(result.origin.selectedCurrency.balanceAfter).toBe(
      200000000000n - BigInt(options.currency.amount)
    )
    expect(result.origin.selectedCurrency.sufficient).toBe(true) // 190 DOT > 0.1 DOT
    expect(result.origin.xcmFee.currencySymbol).toBe('DOT')
    expect(result.origin.xcmFee.fee).toBe(100000000n)
    expect(result.origin.xcmFee.sufficient).toBe(true) // 200 DOT > 0.01 DOT
    expect(result.assetHub).toBeDefined()
    expect(result.bridgeHub).toBeDefined()
    expect(result.destination).toBeDefined()
  })

  it('should build hop info for each hop in the hops array from getXcmFee', async () => {
    const mockHopsFromFee = [
      {
        chain: 'Hydration',
        result: { fee: 12345n, currency: 'HDX' }
      },
      {
        chain: 'Interlay',
        result: { fee: 56789n, currency: 'INTR' }
      }
    ]

    const mockHydraHopInfo = {
      balance: 100n,
      currencySymbol: 'HDX',
      existentialDeposit: 1n,
      xcmFee: { fee: 12345n, balance: 100n, currencySymbol: 'HDX' }
    }

    const mockInterlayHopInfo = {
      balance: 200n,
      currencySymbol: 'INTR',
      existentialDeposit: 2n,
      xcmFee: { fee: 56789n, balance: 200n, currencySymbol: 'INTR' }
    }

    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { fee: 100000000n, currency: 'DOT' } as TXcmFeeDetail,
      assetHub: undefined,
      bridgeHub: undefined,
      hops: mockHopsFromFee as TXcmFeeHopInfo[],
      destination: { fee: 70000000n, currency: 'DOT' } as TXcmFeeDetail
    })

    vi.mocked(buildHopInfo).mockImplementation(({ node }) => {
      if (node === 'Hydration') return Promise.resolve(mockHydraHopInfo)
      if (node === 'Interlay') return Promise.resolve(mockInterlayHopInfo)
      return Promise.resolve({} as TTransferInfo['assetHub'])
    })

    const options = { ...baseOptions, api: mockApi, tx: mockTx }

    const result = await getTransferInfo(options)

    expect(buildHopInfo).toHaveBeenCalledTimes(2)

    expect(buildHopInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        node: 'Hydration',
        feeData: mockHopsFromFee[0].result
      })
    )
    expect(buildHopInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        node: 'Interlay',
        feeData: mockHopsFromFee[1].result
      })
    )

    expect(result.assetHub).toBeUndefined()
    expect(result.bridgeHub).toBeUndefined()

    expect(result.hops).toBeDefined()
    expect(result.hops).toHaveLength(2)
    expect(result.hops).toEqual([
      {
        chain: 'Hydration',
        result: mockHydraHopInfo
      },
      {
        chain: 'Interlay',
        result: mockInterlayHopInfo
      }
    ])
  })

  it('should throw InvalidParameterError if origin is EVM and ahAddress is not provided', async () => {
    vi.mocked(isNodeEvm).mockReturnValue(true)
    const options = {
      ...baseOptions,
      api: mockApi,
      tx: mockTx,
      ahAddress: undefined,
      origin: 'Moonbeam' as TNodeDotKsmWithRelayChains
    }

    await expect(getTransferInfo(options)).rejects.toThrow(InvalidParameterError)
    await expect(getTransferInfo(options)).rejects.toThrow(
      'ahAddress is required for EVM origin Moonbeam.'
    )
    expect(mockApi.init).not.toHaveBeenCalled()
  })

  it('should use getBalanceNativeInternal for fee balance if feeAsset is not provided', async () => {
    const options = { ...baseOptions, api: mockApi, tx: mockTx, feeAsset: undefined }
    vi.mocked(resolveFeeAsset).mockReturnValue(undefined)

    await getTransferInfo(options)

    expect(getAssetBalanceInternal).toHaveBeenCalledTimes(1)
    expect(getAssetBalanceInternal).toHaveBeenCalledWith({
      api: mockApi,
      address: options.senderAddress,
      node: options.origin,
      currency: options.currency
    })
    expect(getBalanceNativeInternal).toHaveBeenCalledTimes(1)
    expect(getBalanceNativeInternal).toHaveBeenCalledWith({
      api: mockApi,
      address: options.senderAddress,
      node: options.origin
    })
  })

  it('should throw InvalidParameterError if getXcmFee does not return originFee', async () => {
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { fee: undefined, currency: 'DOT' } as TXcmFeeDetail,
      assetHub: { fee: 50000000n, currency: 'DOT' } as TXcmFeeDetail,
      bridgeHub: { fee: 60000000n, currency: 'DOT' } as TXcmFeeDetail,
      hops: [],
      destination: { fee: 70000000n, currency: 'DOT' } as TXcmFeeDetail
    })
    const options = { ...baseOptions, api: mockApi, tx: mockTx }

    await expect(getTransferInfo(options)).rejects.toThrow(InvalidParameterError)
    await expect(getTransferInfo(options)).rejects.toThrow(
      `Cannot get origin xcm fee for currency ${JSON.stringify(options.currency)} on node ${options.origin}.`
    )
    expect(mockApi.setDisconnectAllowed).toHaveBeenLastCalledWith(true)
    expect(mockApi.disconnect).toHaveBeenCalled()
  })

  it('should correctly calculate originBalanceFeeAfter when feeAsset is same as transfer currency on AssetHubPolkadot (isFeeAssetAh true)', async () => {
    const ahOrigin = 'AssetHubPolkadot' as TNodeDotKsmWithRelayChains
    const sameCurrency = {
      symbol: 'USDT',
      amount: '50000000'
    } as WithAmount<TCurrencyCore>
    vi.mocked(isNodeEvm).mockReturnValue(false)
    vi.mocked(isAssetEqual).mockReturnValue(true)
    vi.mocked(findAssetForNodeOrThrow).mockReturnValue({
      symbol: 'USDT',
      assetId: '1984',
      decimals: 6
    })
    vi.mocked(resolveFeeAsset).mockImplementation(feeAsset => feeAsset as TAsset)
    vi.mocked(getAssetBalanceInternal)
      .mockResolvedValueOnce(100000000n)
      .mockResolvedValueOnce(100000000n)

    const options = {
      ...baseOptions,
      api: mockApi,
      tx: mockTx,
      origin: ahOrigin,
      currency: sameCurrency,
      feeAsset: sameCurrency
    } as TGetTransferInfoOptions<unknown, unknown>

    const result = await getTransferInfo(options)

    expect(result.origin.xcmFee.balanceAfter).toBe(100000000n - BigInt(sameCurrency.amount))
    expect(result.origin.xcmFee.balanceAfter).toBe(50000000n)
  })

  it('should correctly calculate originBalanceFeeAfter when feeAsset is different (isFeeAssetAh false)', async () => {
    vi.mocked(isAssetEqual).mockReturnValue(false)
    const originFeeVal = 100000000n
    const originBalanceFeeVal = 200000000000n

    const options = { ...baseOptions, api: mockApi, tx: mockTx }
    const result = await getTransferInfo(options)

    expect(result.origin.xcmFee.balanceAfter).toBe(originBalanceFeeVal - originFeeVal)
  })

  it('should not build assetHub info if assetHubFeeResult is undefined', async () => {
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { fee: 100000000n, currency: 'DOT' } as TXcmFeeDetail,
      assetHub: undefined,
      bridgeHub: { fee: 60000000n, currency: 'DOT' } as TXcmFeeDetail,
      hops: [],
      destination: { fee: 70000000n, currency: 'DOT' } as TXcmFeeDetail
    })
    const options = { ...baseOptions, api: mockApi, tx: mockTx }
    const result = await getTransferInfo(options)

    expect(result.assetHub).toBeUndefined()
    expect(buildHopInfo).toHaveBeenCalledTimes(1) // Only for BridgeHub
  })

  it('should not build bridgeHub info if bridgeHubFeeResult is undefined', async () => {
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { fee: 100000000n, currency: 'DOT' } as TXcmFeeDetail,
      assetHub: { fee: 50000000n, currency: 'DOT' } as TXcmFeeDetail,
      bridgeHub: undefined,
      hops: [],
      destination: { fee: 70000000n, currency: 'DOT' } as TXcmFeeDetail
    })
    const options = { ...baseOptions, api: mockApi, tx: mockTx }
    const result = await getTransferInfo(options)

    expect(result.bridgeHub).toBeUndefined()
    expect(buildHopInfo).toHaveBeenCalledTimes(1)
  })

  it('should correctly determine Kusama hop nodes if origin is Kusama based', async () => {
    vi.mocked(determineRelayChain).mockReturnValue('Kusama')
    vi.mocked(getRelayChainSymbol).mockReturnValue('KSM')
    const options = {
      ...baseOptions,
      api: mockApi,
      tx: mockTx,
      origin: 'Karura' as TNodeDotKsmWithRelayChains
    }
    await getTransferInfo(options)

    expect(buildHopInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        node: 'AssetHubKusama'
      })
    )
    expect(buildHopInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        node: 'BridgeHubKusama'
      })
    )
  })

  it('should reflect insufficient balances', async () => {
    vi.mocked(getAssetBalanceInternal)
      .mockResolvedValueOnce(50000000n)
      .mockResolvedValueOnce(1000000000n)

    const options = { ...baseOptions, api: mockApi, tx: mockTx }
    const result = await getTransferInfo(options)

    expect(result.origin.xcmFee.sufficient).toBe(false)
    expect(result.origin.selectedCurrency.sufficient).toBe(false)
  })

  it('should call api.setDisconnectAllowed(true) and api.disconnect() in finally block even on error', async () => {
    vi.mocked(findAssetForNodeOrThrow).mockImplementation(() => {
      throw new Error('Simulated error in findAssetOnDestOrThrow')
    })
    const options = { ...baseOptions, api: mockApi, tx: mockTx }

    await expect(getTransferInfo(options)).rejects.toThrow(
      'Simulated error in findAssetOnDestOrThrow'
    )

    expect(mockApi.setDisconnectAllowed).toHaveBeenCalledTimes(2)
    expect(mockApi.setDisconnectAllowed).toHaveBeenCalledWith(false)
    expect(mockApi.setDisconnectAllowed).toHaveBeenLastCalledWith(true)
    expect(mockApi.disconnect).toHaveBeenCalledTimes(1)
  })

  it('should handle EVM origin correctly with ahAddress provided', async () => {
    vi.mocked(isNodeEvm).mockReturnValue(true)
    const options = {
      ...baseOptions,
      api: mockApi,
      tx: mockTx,
      origin: 'Moonbeam' as TNodeDotKsmWithRelayChains,
      ahAddress: 'evmAhAddress'
    }

    await getTransferInfo(options)

    expect(mockApi.init).toHaveBeenCalledWith(options.origin)
    expect(buildHopInfo).toHaveBeenCalledWith(
      expect.objectContaining({ ahAddress: 'evmAhAddress' })
    )
  })
})
