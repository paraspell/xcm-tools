import type { TAssetInfo, TCurrencyCore, WithAmount } from '@paraspell/assets'
import { getExistentialDepositOrThrow } from '@paraspell/assets'
import {
  findAssetInfoOrThrow,
  getRelayChainSymbol,
  isAssetEqual,
  isChainEvm
} from '@paraspell/assets'
import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getAssetBalanceInternal, getBalanceNative } from '../../balance'
import { InvalidParameterError } from '../../errors'
import type {
  TGetTransferInfoOptions,
  TTransferInfo,
  TXcmFeeDetail,
  TXcmFeeHopInfo
} from '../../types'
import { abstractDecimals, getRelayChainOf } from '../../utils'
import { getXcmFee } from '../fees'
import { resolveFeeAsset } from '../utils'
import { buildDestInfo } from './buildDestInfo'
import { buildHopInfo } from './buildHopInfo'
import { getTransferInfo } from './getTransferInfo'

vi.mock('@paraspell/assets', async importOriginal => {
  const actual = await importOriginal<typeof import('@paraspell/assets')>()
  return {
    ...actual,
    findAssetInfoOrThrow: vi.fn(),
    getExistentialDepositOrThrow: vi.fn(),
    getRelayChainSymbol: vi.fn(),
    isAssetXcEqual: vi.fn(),
    isAssetEqual: vi.fn(),
    isChainEvm: vi.fn()
  }
})

vi.mock('../../errors')
vi.mock('../../utils')
vi.mock('../../pallets/assets/balance')
vi.mock('../../balance')
vi.mock('../utils')
vi.mock('../fees')
vi.mock('./buildDestInfo')
vi.mock('./buildHopInfo')

describe('getTransferInfo', () => {
  let mockApi: IPolkadotApi<unknown, unknown>
  let mockTx: unknown
  let baseOptions: Omit<TGetTransferInfoOptions<unknown, unknown>, 'api' | 'tx'>

  const buildTx = vi.fn(async () => Promise.resolve(mockTx))

  const asset = {
    symbol: 'DOT',
    assetId: '1',
    decimals: 10
  } as TAssetInfo

  beforeEach(() => {
    vi.clearAllMocks()

    mockApi = {
      init: vi.fn().mockResolvedValue(undefined),
      setDisconnectAllowed: vi.fn(),
      disconnect: vi.fn().mockResolvedValue(undefined)
    } as unknown as IPolkadotApi<unknown, unknown>
    mockTx = {}

    baseOptions = {
      buildTx,
      origin: 'Polkadot' as TSubstrateChain,
      destination: 'AssetHubPolkadot' as TChain,
      senderAddress: 'senderAlice',
      ahAddress: 'ahBob',
      address: 'receiverCharlie',
      currency: {
        symbol: 'DOT',
        amount: 10000000000n,
        type: 'NATIVE'
      } as WithAmount<TCurrencyCore>,
      feeAsset: { symbol: 'DOT', type: 'NATIVE' } as TCurrencyCore
    }

    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(resolveFeeAsset).mockImplementation(feeAsset => feeAsset as TAssetInfo)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: 'DOT',
      assetId: '1',
      decimals: 10
    })
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(200000000000n)
    vi.mocked(getBalanceNative).mockResolvedValue(200000000000n)
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(1000000000n)
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { fee: 100000000n, currency: 'DOT' } as TXcmFeeDetail,
      assetHub: { fee: 50000000n, currency: 'DOT' } as TXcmFeeDetail,
      bridgeHub: { fee: 60000000n, currency: 'DOT' } as TXcmFeeDetail,
      hops: [],
      destination: { fee: 70000000n, currency: 'DOT' } as TXcmFeeDetail
    })
    vi.mocked(isAssetEqual).mockReturnValue(false)
    vi.mocked(getRelayChainOf).mockReturnValue('Polkadot')
    vi.mocked(getRelayChainSymbol).mockReturnValue('DOT')
    vi.mocked(buildHopInfo).mockResolvedValue({
      currencySymbol: 'DOT',
      asset: { symbol: 'DOT', assetId: 'DOT', decimals: 10 } as TAssetInfo,
      existentialDeposit: 0n,
      xcmFee: {
        fee: 0n,
        currencySymbol: 'DOT',
        asset: { symbol: 'DOT', assetId: 'DOT', decimals: 10 } as TAssetInfo
      }
    })
    vi.mocked(buildDestInfo).mockResolvedValue({
      receivedCurrency: {
        sufficient: true,
        receivedAmount: 10000000000n,
        balance: 0n,
        balanceAfter: BigInt(baseOptions.currency.amount),
        currencySymbol: 'DOT',
        asset: { symbol: 'DOT', assetId: 'DOT', decimals: 10 } as TAssetInfo,
        existentialDeposit: 100000000n
      },
      xcmFee: {
        fee: 70000000n,
        balanceAfter: 0n,
        balance: 0n,
        currencySymbol: 'DOT',
        asset: { symbol: 'DOT', assetId: 'DOT', decimals: 10 } as TAssetInfo
      }
    })
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
  })

  it('should successfully get transfer info for a Polkadot parachain transfer with all hops', async () => {
    const options = { ...baseOptions, api: mockApi, tx: mockTx }

    const initSpy = vi.spyOn(mockApi, 'init')
    const disconnectAllowedSpy = vi.spyOn(mockApi, 'setDisconnectAllowed')
    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    const result = await getTransferInfo(options)

    expect(initSpy).toHaveBeenCalledWith(options.origin)
    expect(disconnectAllowedSpy).toHaveBeenCalledWith(false)
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith(
      options.origin,
      options.currency,
      options.destination
    )
    expect(getAssetBalanceInternal).toHaveBeenCalledTimes(2)
    expect(getBalanceNative).not.toHaveBeenCalled()
    expect(getExistentialDepositOrThrow).toHaveBeenCalledWith(options.origin, options.currency)
    expect(getXcmFee).toHaveBeenCalledWith({
      api: mockApi,
      buildTx,
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
    expect(disconnectAllowedSpy).toHaveBeenCalledWith(true)
    expect(disconnectSpy).toHaveBeenCalled()

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
      asset: { symbol: 'HDX', assetId: 'HDX', decimals: 12 } as TAssetInfo,
      existentialDeposit: 1n,
      xcmFee: {
        fee: 12345n,
        balance: 100n,
        currencySymbol: 'HDX',
        asset: { symbol: 'HDX', assetId: 'HDX', decimals: 12 } as TAssetInfo
      }
    }

    const mockInterlayHopInfo = {
      balance: 200n,
      currencySymbol: 'INTR',
      asset: { symbol: 'INTR', assetId: 'INTR', decimals: 10 } as TAssetInfo,
      existentialDeposit: 2n,
      xcmFee: {
        fee: 56789n,
        balance: 200n,
        currencySymbol: 'INTR',
        asset: { symbol: 'INTR', assetId: 'INTR', decimals: 10 } as TAssetInfo
      }
    }

    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { fee: 100000000n, currency: 'DOT' } as TXcmFeeDetail,
      assetHub: undefined,
      bridgeHub: undefined,
      hops: mockHopsFromFee as TXcmFeeHopInfo[],
      destination: { fee: 70000000n, currency: 'DOT' } as TXcmFeeDetail
    })

    vi.mocked(buildHopInfo).mockImplementation(({ chain }) => {
      if (chain === 'Hydration') return Promise.resolve(mockHydraHopInfo)
      if (chain === 'Interlay') return Promise.resolve(mockInterlayHopInfo)
      return Promise.resolve({} as TTransferInfo['assetHub'])
    })

    const options = { ...baseOptions, api: mockApi, tx: mockTx }

    const result = await getTransferInfo(options)

    expect(buildHopInfo).toHaveBeenCalledTimes(2)

    expect(buildHopInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        chain: 'Hydration',
        feeData: mockHopsFromFee[0].result
      })
    )
    expect(buildHopInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        chain: 'Interlay',
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
    vi.mocked(isChainEvm).mockReturnValue(true)
    const options = {
      ...baseOptions,
      api: mockApi,
      tx: mockTx,
      ahAddress: undefined,
      origin: 'Moonbeam' as TSubstrateChain
    }

    const initSpy = vi.spyOn(mockApi, 'init')

    await expect(getTransferInfo(options)).rejects.toThrow(InvalidParameterError)
    expect(initSpy).not.toHaveBeenCalled()
  })

  it('should use getBalanceNativeInternal for fee balance if feeAsset is not provided', async () => {
    const options = { ...baseOptions, api: mockApi, tx: mockTx, feeAsset: undefined }
    vi.mocked(resolveFeeAsset).mockReturnValue(undefined)

    await getTransferInfo(options)

    expect(getAssetBalanceInternal).toHaveBeenCalledTimes(1)
    expect(getAssetBalanceInternal).toHaveBeenCalledWith({
      api: mockApi,
      address: options.senderAddress,
      chain: options.origin,
      asset
    })
    expect(getBalanceNative).toHaveBeenCalledTimes(1)
    expect(getBalanceNative).toHaveBeenCalledWith({
      api: mockApi,
      address: options.senderAddress,
      chain: options.origin
    })
  })

  it('should correctly calculate originBalanceFeeAfter when feeAsset is same as transfer currency on AssetHubPolkadot (isFeeAssetAh true)', async () => {
    const ahOrigin = 'AssetHubPolkadot' as TSubstrateChain
    const sameCurrency = {
      symbol: 'USDT',
      amount: 50000000n
    } as WithAmount<TCurrencyCore>
    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(isAssetEqual).mockReturnValue(true)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue({
      symbol: 'USDT',
      assetId: '1984',
      decimals: 6
    })
    vi.mocked(resolveFeeAsset).mockImplementation(feeAsset => feeAsset as TAssetInfo)
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

  it('should correctly determine Kusama hop chains if origin is Kusama based', async () => {
    vi.mocked(getRelayChainOf).mockReturnValue('Kusama')
    vi.mocked(getRelayChainSymbol).mockReturnValue('KSM')
    const options = {
      ...baseOptions,
      api: mockApi,
      tx: mockTx,
      origin: 'Karura' as TSubstrateChain
    }
    await getTransferInfo(options)

    expect(buildHopInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        chain: 'AssetHubKusama'
      })
    )
    expect(buildHopInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        chain: 'BridgeHubKusama'
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
    vi.mocked(findAssetInfoOrThrow).mockImplementation(() => {
      throw new Error('Simulated error in findAssetInfoOrThrow')
    })
    const options = { ...baseOptions, api: mockApi, tx: mockTx }

    const disconnectAllowedSpy = vi.spyOn(mockApi, 'setDisconnectAllowed')
    const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

    await expect(getTransferInfo(options)).rejects.toThrow(
      'Simulated error in findAssetInfoOrThrow'
    )

    expect(disconnectAllowedSpy).toHaveBeenCalledTimes(2)
    expect(disconnectAllowedSpy).toHaveBeenCalledWith(false)
    expect(disconnectAllowedSpy).toHaveBeenLastCalledWith(true)
    expect(disconnectSpy).toHaveBeenCalledTimes(1)
  })

  it('should handle EVM origin correctly with ahAddress provided', async () => {
    vi.mocked(isChainEvm).mockReturnValue(true)
    const options = {
      ...baseOptions,
      api: mockApi,
      tx: mockTx,
      origin: 'Moonbeam' as TSubstrateChain,
      ahAddress: 'evmAhAddress'
    }

    const initSpy = vi.spyOn(mockApi, 'init')

    await getTransferInfo(options)

    expect(initSpy).toHaveBeenCalledWith(options.origin)
    expect(buildHopInfo).toHaveBeenCalledWith(
      expect.objectContaining({ ahAddress: 'evmAhAddress' })
    )
  })
})
