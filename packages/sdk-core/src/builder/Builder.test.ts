// Contains builder pattern tests for different Builder pattern functionalities

import type { TAssetInfo } from '@paraspell/assets'
import {
  findAssetInfoOrThrow,
  getRelayChainSymbol,
  type TCurrencyInputWithAmount
} from '@paraspell/assets'
import { type TChain, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api/IPolkadotApi'
import {
  claimAssets,
  getMinTransferableAmount,
  getOriginXcmFee,
  getOriginXcmFeeEstimate,
  getTransferableAmount,
  getTransferInfo,
  getXcmFee,
  getXcmFeeEstimate,
  send,
  verifyEdOnDestination
} from '../transfer'
import type {
  TDryRunResult,
  TGetXcmFeeEstimateDetail,
  TGetXcmFeeEstimateResult,
  TGetXcmFeeResult,
  TTransferInfo,
  TXcmFeeDetail
} from '../types'
import { assertAddressIsString, assertToIsString, isConfig } from '../utils'
import { buildDryRun } from './buildDryRun'
import { Builder } from './Builder'

vi.mock('../transfer')
vi.mock('../utils')
vi.mock('./buildDryRun')
vi.mock('@paraspell/assets')

const CHAIN: TChain = 'Acala'
const CHAIN_2: TChain = 'Hydration'
const AMOUNT = 1000
const CURRENCY = { symbol: 'ACA', amount: AMOUNT }
const CURRENCY_ID = -1n
const ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
const SENDER_ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
const PARA_ID_TO = 1999

describe('Builder', () => {
  const mockApi = {
    init: vi.fn(),
    setApi: vi.fn(),
    callTxMethod: vi.fn(),
    callBatchMethod: vi.fn(),
    setDisconnectAllowed: vi.fn(),
    disconnect: vi.fn(),
    getConfig: vi.fn().mockReturnValue({ abstractDecimals: true }),
    clone: vi.fn().mockReturnValue({
      init: vi.fn(),
      setApi: vi.fn(),
      clone: vi.fn()
    })
  } as unknown as IPolkadotApi<unknown, unknown>
  const mockExtrinsic = {
    method: 'transfer',
    args: []
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isConfig).mockReturnValue(true)
    vi.mocked(getRelayChainSymbol).mockReturnValue('DOT')
  })

  describe('Para to Para / Para to Relay / Relay to Para  transfer', () => {
    beforeEach(() => {
      vi.mocked(send).mockResolvedValue(mockExtrinsic)
    })

    it('should initiate a para to para transfer with currency symbol', async () => {
      await Builder(mockApi).from(CHAIN).to(CHAIN_2).currency(CURRENCY).address(ADDRESS).build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        currency: CURRENCY,
        address: ADDRESS,
        to: CHAIN_2
      })
    })

    it('should initiate a para to para transfer with currency symbol', async () => {
      const tx = await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        currency: CURRENCY,
        address: ADDRESS,
        to: CHAIN_2
      })
      expect(tx).toEqual(mockExtrinsic)
    })

    it('should initiate a para to para transfer with custom paraId', async () => {
      await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2, PARA_ID_TO)
        .currency(CURRENCY)
        .address(ADDRESS)
        .build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        currency: CURRENCY,
        address: ADDRESS,
        to: CHAIN_2,
        paraIdTo: PARA_ID_TO
      })
    })

    it('should initiate a transfer with assetHub address', async () => {
      const ASSET_HUB_ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
      await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2, PARA_ID_TO)
        .currency(CURRENCY)
        .address(ADDRESS)
        .ahAddress(ASSET_HUB_ADDRESS)
        .build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        currency: CURRENCY,
        address: ADDRESS,
        ahAddress: ASSET_HUB_ADDRESS,
        to: CHAIN_2,
        paraIdTo: PARA_ID_TO
      })
    })

    it('should initiate a para to para transfer with specified asset ID', async () => {
      const ASSET_ID = 1
      await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2, PARA_ID_TO)
        .currency({
          id: ASSET_ID,
          amount: AMOUNT
        })
        .address(ADDRESS)
        .build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        currency: {
          id: ASSET_ID,
          amount: AMOUNT
        },
        address: ADDRESS,
        to: CHAIN_2,
        paraIdTo: PARA_ID_TO
      })
    })

    it('should initiate a para to para transfer with overriden version', async () => {
      const version = Version.V4

      await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2, PARA_ID_TO)
        .currency(CURRENCY)
        .address(ADDRESS)
        .xcmVersion(version)
        .build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        currency: CURRENCY,
        address: ADDRESS,
        to: CHAIN_2,
        paraIdTo: PARA_ID_TO,
        version
      })
    })

    it('should initiate a para to para transfer with currency id', async () => {
      await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2)
        .currency({ id: CURRENCY_ID, amount: AMOUNT })
        .address(ADDRESS)
        .build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        currency: { id: CURRENCY_ID, amount: AMOUNT },
        address: ADDRESS,
        to: CHAIN_2
      })
    })

    it('should initiate a para to para transfer with fee asset', async () => {
      const currency: TCurrencyInputWithAmount = [
        { id: CURRENCY_ID, amount: AMOUNT },
        { symbol: 'USDT', amount: 10000 }
      ]

      await Builder(mockApi).from(CHAIN).to(CHAIN_2).currency(currency).address(ADDRESS).build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        currency,
        address: ADDRESS,
        to: CHAIN_2
      })
    })

    it('should initiate a para to para transfer with two overriden multi asset', async () => {
      const currency: TCurrencyInputWithAmount = [
        {
          id: {
            parents: 0,
            interior: {
              X2: [
                {
                  PalletInstance: '50'
                },
                {
                  Parachain: '30'
                }
              ]
            }
          },
          fun: {
            Fungible: '102928'
          }
        },
        {
          id: {
            parents: 0,
            interior: {
              X2: [
                {
                  PalletInstance: '50'
                },
                {
                  Parachain: '1337'
                }
              ]
            }
          },
          fun: {
            Fungible: '38482'
          }
        }
      ]

      await Builder(mockApi).from(CHAIN).to(CHAIN_2).currency(currency).address(ADDRESS).build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        currency,
        address: ADDRESS,
        to: CHAIN_2
      })
    })

    it('should initiate a para to relay transfer with currency symbol', async () => {
      const currency = getRelayChainSymbol(CHAIN)

      await Builder(mockApi)
        .from(CHAIN)
        .to('Polkadot')
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        to: 'Polkadot',
        currency: {
          symbol: currency,
          amount: AMOUNT
        },
        address: ADDRESS
      })
    })

    it('should initiate a para to relay transfer', async () => {
      const tx = await Builder(mockApi)
        .from(CHAIN)
        .to('Polkadot')
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        to: 'Polkadot',
        currency: {
          symbol: getRelayChainSymbol(CHAIN),
          amount: AMOUNT
        },
        address: ADDRESS
      })
      expect(tx).toEqual(mockExtrinsic)
    })

    it('should initiate a para to relay transfer with currency symbol', async () => {
      const currency = getRelayChainSymbol(CHAIN)

      await Builder(mockApi)
        .from(CHAIN)
        .to('Polkadot')
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        to: 'Polkadot',
        currency: {
          symbol: currency,
          amount: AMOUNT
        },
        address: ADDRESS
      })
    })

    it('should initiate a para to relay transfer with fee asset', async () => {
      const currency: TCurrencyInputWithAmount = [
        { symbol: 'DOT', amount: AMOUNT },
        { symbol: 'USDT', amount: 10000 }
      ]

      const feeAsset = {
        symbol: 'USDT'
      }

      await Builder(mockApi)
        .from(CHAIN)
        .to('Polkadot')
        .currency(currency)
        .feeAsset(feeAsset)
        .address(ADDRESS)
        .build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        to: 'Polkadot',
        currency,
        feeAsset,
        address: ADDRESS
      })
    })

    it('should initiate a para to relay transfer with overriden version', async () => {
      const currency = getRelayChainSymbol(CHAIN)
      const version = Version.V4

      await Builder(mockApi)
        .from(CHAIN)
        .to('Polkadot')
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .xcmVersion(version)
        .build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        to: 'Polkadot',
        currency: {
          symbol: currency,
          amount: AMOUNT
        },
        address: ADDRESS,
        version
      })
    })

    it('should initiate a para to relay transfer with fee asset and overriden version', async () => {
      const currency: TCurrencyInputWithAmount = [
        { symbol: 'DOT', amount: AMOUNT },
        { symbol: 'USDT', amount: 10000 }
      ]

      const version = Version.V4
      const feeAsset = {
        symbol: 'USDT'
      }

      await Builder(mockApi)
        .from(CHAIN)
        .to('Polkadot')
        .currency(currency)
        .feeAsset(feeAsset)
        .address(ADDRESS)
        .xcmVersion(version)
        .build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        to: 'Polkadot',
        currency: currency,
        feeAsset,
        address: ADDRESS,
        version
      })
    })

    it('should request a para to para transfer api call with currency id', async () => {
      await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2)
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .build()

      expect(send).toHaveBeenCalledTimes(1)
    })

    it('should initiate a para to relay transfer using batching', async () => {
      await Builder(mockApi)
        .from(CHAIN)
        .to('Polkadot')
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .addToBatch()
        .from(CHAIN)
        .to('Polkadot')
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .addToBatch()
        .buildBatch()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        to: 'Polkadot',
        currency: {
          symbol: getRelayChainSymbol(CHAIN),
          amount: AMOUNT
        },
        address: ADDRESS
      })

      expect(send).toHaveBeenCalledTimes(2)
    })

    it('should initiate a para to para transfer using batching', async () => {
      await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .addToBatch()
        .buildBatch()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        to: CHAIN_2,
        currency: CURRENCY,
        address: ADDRESS
      })
    })

    it('should initiate a double para to para transfer using batching', async () => {
      await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .addToBatch()
        .from(CHAIN)
        .to(CHAIN_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .addToBatch()
        .buildBatch()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: CHAIN,
        to: CHAIN_2,
        currency: CURRENCY,
        address: ADDRESS
      })

      expect(send).toHaveBeenCalledTimes(2)
    })

    it('should throw if trying to build when transactions are batched', async () => {
      await expect(
        Builder(mockApi)
          .from(CHAIN)
          .to(CHAIN_2)
          .currency(CURRENCY)
          .address(ADDRESS)
          .addToBatch()
          .from(CHAIN)
          .to(CHAIN_2)
          .currency(CURRENCY)
          .address(ADDRESS)
          .build()
      ).rejects.toThrow(
        'Transaction manager contains batched items. Use buildBatch() to process them.'
      )
    })

    it('should initiate a relay to para transfer', async () => {
      await Builder(mockApi)
        .from('Polkadot')
        .to(CHAIN)
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: 'Polkadot',
        to: CHAIN,
        currency: { symbol: 'DOT', amount: AMOUNT },
        address: ADDRESS
      })
    })

    it('should initiate a relay to para transfer with custom paraId', async () => {
      await Builder(mockApi)
        .from('Polkadot')
        .to(CHAIN, PARA_ID_TO)
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: 'Polkadot',
        to: CHAIN,
        currency: { symbol: 'DOT', amount: AMOUNT },
        address: ADDRESS,
        paraIdTo: PARA_ID_TO
      })
    })

    it('should initiate a relay to para transfer with overriden version', async () => {
      const version = Version.V4

      await Builder(mockApi)
        .from('Polkadot')
        .to(CHAIN, PARA_ID_TO)
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .xcmVersion(version)
        .build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: 'Polkadot',
        to: CHAIN,
        currency: { symbol: 'DOT', amount: AMOUNT },
        address: ADDRESS,
        paraIdTo: PARA_ID_TO,
        version
      })
    })

    it('should initiate a relay to para transfer with overriden version', async () => {
      const version = Version.V4

      await Builder(mockApi)
        .from('Polkadot')
        .to(CHAIN, PARA_ID_TO)
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .xcmVersion(version)
        .build()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: 'Polkadot',
        to: CHAIN,
        currency: { symbol: 'DOT', amount: AMOUNT },
        address: ADDRESS,
        paraIdTo: PARA_ID_TO,
        version
      })
    })

    it('should fail to initiate a relay to para transfer to ethereum', () => {
      expect(() =>
        Builder(mockApi)
          .from('Polkadot')
          .to('Ethereum')
          .currency({ symbol: 'DOT', amount: AMOUNT })
          .address(ADDRESS)
          .build()
      ).toThrow()
    })

    it('should request a relay to para transfer api call', async () => {
      await Builder(mockApi)
        .from('Polkadot')
        .to(CHAIN_2)
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .build()

      expect(send).toHaveBeenCalledTimes(1)
    })

    it('should initiate a double relay to para transfer using batching', async () => {
      await Builder(mockApi)
        .from('Polkadot')
        .to(CHAIN_2)
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .addToBatch()
        .from('Polkadot')
        .to(CHAIN_2)
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .addToBatch()
        .buildBatch()

      expect(send).toHaveBeenCalledWith({
        api: mockApi,
        from: 'Polkadot',
        to: CHAIN_2,
        currency: { symbol: 'DOT', amount: AMOUNT },
        address: ADDRESS
      })

      expect(send).toHaveBeenCalledTimes(2)
    })

    it('should disconnect the api after building', async () => {
      const disconnectAllowedSpy = vi.spyOn(mockApi, 'setDisconnectAllowed')
      const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

      const builder = Builder(mockApi)
        .from('Polkadot')
        .to(CHAIN_2)
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)

      const tx = await builder.build()
      expect(tx).toBeDefined()

      await builder.disconnect()

      expect(disconnectAllowedSpy).not.toHaveBeenCalled()
      expect(disconnectSpy).toHaveBeenCalledWith()
    })
  })

  describe('Claim asset', () => {
    it('should create a normal claim asset tx', async () => {
      vi.mocked(claimAssets).mockResolvedValue(mockExtrinsic)
      await Builder(mockApi).claimFrom(CHAIN).currency([]).address(ADDRESS).build()
      expect(claimAssets).toHaveBeenCalledTimes(1)
      expect(claimAssets).toHaveBeenCalledWith({
        api: mockApi,
        chain: CHAIN,
        currency: [],
        address: ADDRESS
      })
    })

    it('should create a claim asset tx with valid output', async () => {
      vi.mocked(claimAssets).mockResolvedValue({
        method: 'claim',
        args: []
      })
      const tx = await Builder(mockApi)
        .claimFrom(CHAIN)
        .currency([])
        .address(ADDRESS)
        .xcmVersion(Version.V3)
        .build()

      expect(tx).toHaveProperty('method')
      expect(tx).toHaveProperty('args')
      expect(claimAssets).toHaveBeenCalledTimes(1)
    })

    it('should disconnect the api after building', async () => {
      vi.mocked(claimAssets).mockResolvedValue({
        method: 'claim',
        args: []
      })

      const disconnectAllowedSpy = vi.spyOn(mockApi, 'setDisconnectAllowed')
      const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

      const builder = Builder(mockApi).claimFrom(CHAIN).currency([]).address(ADDRESS)

      const tx = await builder.build()
      expect(tx).toBeDefined()

      await builder.disconnect()

      expect(disconnectAllowedSpy).not.toHaveBeenCalled()
      expect(disconnectSpy).toHaveBeenCalledWith(true)
      expect(claimAssets).toHaveBeenCalledTimes(1)
    })
  })

  describe('Dry run', () => {
    it('should dry run a normal transfer', async () => {
      vi.mocked(buildDryRun).mockResolvedValue({
        origin: {
          success: true,
          fee: 1000n,
          currency: 'DOT',
          asset: {
            symbol: 'DOT',
            decimals: 10
          } as TAssetInfo,
          forwardedXcms: [],
          destParaId: 0
        },
        hops: []
      })

      const result = await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER_ADDRESS)
        .dryRun()

      expect(result).toEqual({
        origin: {
          success: true,
          fee: 1000n,
          forwardedXcms: [],
          destParaId: 0,
          currency: 'DOT',
          asset: {
            symbol: 'DOT',
            decimals: 10
          }
        },
        hops: []
      })
      expect(buildDryRun).toHaveBeenCalledTimes(1)
    })

    it('should dry run preview', async () => {
      const mockDryRunResult = {
        origin: {
          success: true,
          fee: 1000n,
          currency: 'DOT',
          asset: {
            symbol: 'DOT',
            decimals: 10
          } as TAssetInfo,
          forwardedXcms: [],
          destParaId: 0
        },
        hops: []
      } as TDryRunResult

      vi.mocked(buildDryRun).mockResolvedValue(mockDryRunResult)

      const result = await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER_ADDRESS)
        .dryRunPreview({ mintFeeAssets: true })

      expect(result).toEqual(mockDryRunResult)
      expect(buildDryRun).toHaveBeenCalledTimes(1)
    })
  })

  describe('Fee calculation', () => {
    it('should fetch XCM fee ', async () => {
      vi.mocked(getXcmFee).mockResolvedValue({} as TGetXcmFeeResult)

      const SENDER = 'sender-address'

      const result = await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER)
        .getXcmFee()

      expect(result).toEqual({})
      expect(getXcmFee).toHaveBeenCalledTimes(1)
      expect(assertToIsString).toHaveBeenCalledWith(CHAIN_2)
      expect(assertAddressIsString).toHaveBeenCalledWith(ADDRESS)
    })

    it('should fetch origin XCM fee', async () => {
      vi.mocked(getOriginXcmFee).mockResolvedValue({} as TXcmFeeDetail)

      const SENDER = 'sender-address'

      const result = await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER)
        .getOriginXcmFee()

      expect(result).toEqual({})
      expect(getOriginXcmFee).toHaveBeenCalledTimes(1)
      expect(assertToIsString).toHaveBeenCalledWith(CHAIN_2)
    })

    it('should fetch XCM fee estimate', async () => {
      vi.mocked(getXcmFeeEstimate).mockResolvedValue({} as TGetXcmFeeEstimateResult)

      const SENDER = 'sender-address'

      const result = await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER)
        .getXcmFeeEstimate()

      expect(result).toEqual({})
      expect(getXcmFeeEstimate).toHaveBeenCalledTimes(1)
      expect(assertToIsString).toHaveBeenCalledWith(CHAIN_2)
      expect(assertAddressIsString).toHaveBeenCalledWith(ADDRESS)
    })

    it('computes overridden amount when abstractDecimals=false', async () => {
      mockApi.getConfig = vi.fn().mockReturnValue({ abstractDecimals: false })
      vi.mocked(findAssetInfoOrThrow).mockReturnValue({ decimals: 12 } as unknown as TAssetInfo)
      vi.mocked(send).mockResolvedValue(mockExtrinsic)

      await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER_ADDRESS)
        .getXcmFee()

      expect(getXcmFee).toHaveBeenCalledTimes(1)
    })

    it('should fetch origin XCM fee estimate', async () => {
      vi.mocked(getOriginXcmFeeEstimate).mockResolvedValue({} as TGetXcmFeeEstimateDetail)

      const SENDER = 'sender-address'

      const result = await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER)
        .getOriginXcmFeeEstimate()

      expect(result).toEqual({})
      expect(getOriginXcmFeeEstimate).toHaveBeenCalledTimes(1)
      expect(assertToIsString).toHaveBeenCalledWith(CHAIN_2)
    })

    it('should fetch transferable amount', async () => {
      const amount = 1000n

      vi.mocked(getTransferableAmount).mockResolvedValue(amount)

      const SENDER = 'sender-address'

      const result = await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER)
        .getTransferableAmount()

      expect(result).toEqual(amount)
      expect(getTransferableAmount).toHaveBeenCalledTimes(1)
    })

    it('should fetch min transferable amount', async () => {
      const amount = 1000n

      vi.mocked(getMinTransferableAmount).mockResolvedValue(amount)

      const SENDER = 'sender-address'

      const result = await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER)
        .getMinTransferableAmount()

      expect(result).toEqual(amount)
      expect(getMinTransferableAmount).toHaveBeenCalledTimes(1)
    })

    it('should verify ed on destination', async () => {
      const mockResult = true

      vi.mocked(verifyEdOnDestination).mockResolvedValue(mockResult)

      const SENDER = 'sender-address'

      const result = await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER)
        .verifyEdOnDestination()

      expect(result).toEqual(mockResult)
      expect(verifyEdOnDestination).toHaveBeenCalledTimes(1)
      expect(assertAddressIsString).toHaveBeenCalledWith(ADDRESS)
      expect(assertToIsString).toHaveBeenCalledWith(CHAIN_2)
    })

    it('should fetch transfer info', async () => {
      vi.mocked(getTransferInfo).mockResolvedValue({} as TTransferInfo)

      const SENDER = 'sender-address'

      const result = await Builder(mockApi)
        .from(CHAIN)
        .to(CHAIN_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER)
        .getTransferInfo()

      expect(result).toEqual({})
      expect(getTransferInfo).toHaveBeenCalledTimes(1)
      expect(assertAddressIsString).toHaveBeenCalledWith(ADDRESS)
      expect(assertToIsString).toHaveBeenCalledWith(CHAIN_2)
    })
  })
})
