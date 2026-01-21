import type { TAssetInfo, TCurrencyCore, WithAmount } from '@paraspell/assets'
import { getExistentialDepositOrThrow } from '@paraspell/assets'
import {
  findAssetInfoOrThrow,
  getRelayChainSymbol,
  isAssetEqual,
  isChainEvm
} from '@paraspell/assets'
import { type TChain, type TSubstrateChain, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { getAssetBalanceInternal, getBalanceInternal } from '../../balance'
import { MissingParameterError } from '../../errors'
import type {
  TGetTransferInfoOptions,
  TGetXcmFeeResult,
  THopTransferInfo,
  TXcmFeeDetail,
  TXcmFeeHopInfo
} from '../../types'
import { abstractDecimals } from '../../utils'
import { getXcmFee } from '../fees'
import { resolveFeeAsset } from '../utils'
import { buildDestInfo } from './buildDestInfo'
import { buildHopInfo } from './buildHopInfo'
import { getTransferInfo } from './getTransferInfo'

vi.mock('@paraspell/assets', async importActual => ({
  ...(await importActual()),
  findAssetInfoOrThrow: vi.fn(),
  getExistentialDepositOrThrow: vi.fn(),
  getRelayChainSymbol: vi.fn(),
  isAssetXcEqual: vi.fn(),
  isAssetEqual: vi.fn(),
  isChainEvm: vi.fn()
}))

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

  const dotAsset = {
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
      version: Version.V5,
      currency: {
        symbol: 'DOT',
        amount: 10000000000n,
        type: 'NATIVE'
      } as WithAmount<TCurrencyCore>,
      feeAsset: { symbol: 'DOT', type: 'NATIVE' } as TCurrencyCore
    }

    vi.mocked(isChainEvm).mockReturnValue(false)
    vi.mocked(resolveFeeAsset).mockImplementation(feeAsset => feeAsset as TAssetInfo)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(dotAsset)
    vi.mocked(getAssetBalanceInternal).mockResolvedValue(200000000000n)
    vi.mocked(getBalanceInternal).mockResolvedValue(200000000000n)
    vi.mocked(getExistentialDepositOrThrow).mockReturnValue(1000000000n)
    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { fee: 100000000n, asset: dotAsset },
      hops: [
        {
          chain: 'AssetHubPolkadot',
          result: {
            fee: 50000000n,
            asset: dotAsset
          }
        },
        {
          chain: 'BridgeHubPolkadot',
          result: {
            fee: 60000000n,
            asset: dotAsset
          }
        }
      ],
      destination: { fee: 70000000n, asset: dotAsset }
    } as TGetXcmFeeResult)
    vi.mocked(isAssetEqual).mockReturnValue(false)
    vi.mocked(getRelayChainSymbol).mockReturnValue('DOT')
    vi.mocked(buildHopInfo).mockResolvedValue({
      asset: dotAsset,
      xcmFee: {
        fee: 0n,
        asset: dotAsset
      }
    })
    vi.mocked(buildDestInfo).mockResolvedValue({
      receivedCurrency: {
        sufficient: true,
        receivedAmount: 10000000000n,
        balance: 0n,
        balanceAfter: baseOptions.currency.amount,
        asset: dotAsset
      },
      xcmFee: {
        fee: 70000000n,
        balanceAfter: 0n,
        balance: 0n,
        asset: dotAsset
      }
    })
    vi.mocked(abstractDecimals).mockImplementation(amount => BigInt(amount))
  })

  it('should successfully get transfer info for a Polkadot parachain transfer with all hops', async () => {
    const options = { ...baseOptions, api: mockApi }

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
    expect(getBalanceInternal).not.toHaveBeenCalled()
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
      version: options.version,
      disableFallback: false
    })
    expect(buildDestInfo).toHaveBeenCalled()
    expect(disconnectAllowedSpy).toHaveBeenCalledWith(true)
    expect(disconnectSpy).toHaveBeenCalled()

    expect(result.chain.origin).toBe(options.origin)
    expect(result.chain.destination).toBe(options.destination)
    expect(result.chain.ecosystem).toBe('DOT')
    expect(result.origin.selectedCurrency.asset).toEqual(dotAsset)
    expect(result.origin.selectedCurrency.balance).toBe(200000000000n)
    expect(result.origin.selectedCurrency.balanceAfter).toBe(
      200000000000n - BigInt(options.currency.amount)
    )
    expect(result.origin.selectedCurrency.sufficient).toBe(true) // 190 DOT > 0.1 DOT
    expect(result.origin.xcmFee.asset).toEqual(dotAsset)
    expect(result.origin.xcmFee.fee).toBe(100000000n)
    expect(result.origin.xcmFee.sufficient).toBe(true) // 200 DOT > 0.01 DOT
    expect(result.destination).toBeDefined()
  })

  it('should build hop info for each hop in the hops array from getXcmFee', async () => {
    const mockHopsFromFee = [
      {
        chain: 'Hydration',
        result: { fee: 12345n, asset: { symbol: 'HDX' } }
      },
      {
        chain: 'Interlay',
        result: { fee: 56789n, asset: { symbol: 'INTR' } }
      }
    ]

    const mockHydraHopInfo = {
      balance: 100n,
      asset: { symbol: 'HDX', assetId: 'HDX', decimals: 12 } as TAssetInfo,
      xcmFee: {
        fee: 12345n,
        balance: 100n,
        asset: { symbol: 'HDX', assetId: 'HDX', decimals: 12 } as TAssetInfo
      }
    }

    const mockInterlayHopInfo = {
      balance: 200n,
      asset: { symbol: 'INTR', assetId: 'INTR', decimals: 10 } as TAssetInfo,
      xcmFee: {
        fee: 56789n,
        balance: 200n,
        asset: { symbol: 'INTR', assetId: 'INTR', decimals: 10 } as TAssetInfo
      }
    }

    vi.mocked(getXcmFee).mockResolvedValue({
      origin: { fee: 100000000n, asset: { symbol: 'DOT' } } as TXcmFeeDetail,
      hops: mockHopsFromFee as TXcmFeeHopInfo[],
      destination: { fee: 70000000n, asset: { symbol: 'DOT' } } as TXcmFeeDetail
    })

    vi.mocked(buildHopInfo).mockImplementation(({ chain }) => {
      if (chain === 'Hydration') return Promise.resolve(mockHydraHopInfo)
      if (chain === 'Interlay') return Promise.resolve(mockInterlayHopInfo)
      return Promise.resolve({} as THopTransferInfo['result'])
    })

    const options = { ...baseOptions, api: mockApi }

    const result = await getTransferInfo(options)

    expect(buildHopInfo).toHaveBeenCalledTimes(2)

    expect(buildHopInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        chain: 'Hydration',
        fee: mockHopsFromFee[0].result.fee
      })
    )
    expect(buildHopInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        chain: 'Interlay',
        fee: mockHopsFromFee[1].result.fee
      })
    )

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

  it('should throw MissingParameterError if origin is EVM and ahAddress is not provided', async () => {
    vi.mocked(isChainEvm).mockReturnValue(true)
    const options: TGetTransferInfoOptions<unknown, unknown> = {
      ...baseOptions,
      api: mockApi,
      ahAddress: undefined,
      origin: 'Moonbeam'
    }

    const initSpy = vi.spyOn(mockApi, 'init')

    await expect(getTransferInfo(options)).rejects.toThrow(MissingParameterError)
    expect(initSpy).not.toHaveBeenCalled()
  })

  it('should use getAssetBalanceInternal for fee balance if feeAsset is not provided', async () => {
    const options = { ...baseOptions, api: mockApi, feeAsset: undefined }
    vi.mocked(resolveFeeAsset).mockReturnValue(undefined)

    const feeAssetFromFee = {
      symbol: 'FEE',
      assetId: 'FEE',
      decimals: 12
    } as TAssetInfo

    vi.mocked(getXcmFee).mockResolvedValueOnce({
      origin: { fee: 100000000n, feeType: 'paymentInfo', asset: feeAssetFromFee },
      hops: [],
      destination: { fee: 70000000n, feeType: 'paymentInfo', asset: dotAsset }
    } as TGetXcmFeeResult)

    await getTransferInfo(options)

    expect(getAssetBalanceInternal).toHaveBeenCalledTimes(2)
    expect(getAssetBalanceInternal).toHaveBeenNthCalledWith(1, {
      api: mockApi,
      address: options.senderAddress,
      chain: options.origin,
      asset: dotAsset
    })
    expect(getAssetBalanceInternal).toHaveBeenNthCalledWith(2, {
      api: mockApi,
      address: options.senderAddress,
      chain: options.origin,
      asset: feeAssetFromFee
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

    const options: TGetTransferInfoOptions<unknown, unknown> = {
      ...baseOptions,
      api: mockApi,
      origin: ahOrigin,
      currency: sameCurrency,
      feeAsset: sameCurrency
    }

    const result = await getTransferInfo(options)

    expect(result.origin.xcmFee.balanceAfter).toBe(100000000n - BigInt(sameCurrency.amount))
    expect(result.origin.xcmFee.balanceAfter).toBe(50000000n)
  })

  it('should correctly calculate originBalanceFeeAfter when feeAsset is different (isFeeAssetAh false)', async () => {
    vi.mocked(isAssetEqual).mockReturnValue(false)
    const originFeeVal = 100000000n
    const originBalanceFeeVal = 200000000000n

    const options = { ...baseOptions, api: mockApi }
    const result = await getTransferInfo(options)

    expect(result.origin.xcmFee.balanceAfter).toBe(originBalanceFeeVal - originFeeVal)
  })

  it('should correctly determine hop chains if origin is Polkadot based', async () => {
    const options: TGetTransferInfoOptions<unknown, unknown> = {
      ...baseOptions,
      api: mockApi,
      origin: 'Karura'
    }
    await getTransferInfo(options)

    expect(buildHopInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        chain: 'AssetHubPolkadot'
      })
    )
    expect(buildHopInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        chain: 'BridgeHubPolkadot'
      })
    )
  })

  it('should reflect insufficient balances', async () => {
    vi.mocked(getAssetBalanceInternal)
      .mockResolvedValueOnce(50000000n)
      .mockResolvedValueOnce(50000000n)

    const options = { ...baseOptions, api: mockApi }
    const result = await getTransferInfo(options)

    expect(result.origin.xcmFee.sufficient).toBe(false)
    expect(result.origin.selectedCurrency.sufficient).toBe(false)
  })

  it('should call api.setDisconnectAllowed(true) and api.disconnect() in finally block even on error', async () => {
    vi.mocked(findAssetInfoOrThrow).mockImplementation(() => {
      throw new Error('Simulated error in findAssetInfoOrThrow')
    })
    const options = { ...baseOptions, api: mockApi }

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
    const options: TGetTransferInfoOptions<unknown, unknown> = {
      ...baseOptions,
      api: mockApi,
      origin: 'Moonbeam',
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
