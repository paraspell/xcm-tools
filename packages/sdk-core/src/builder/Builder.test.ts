// Contains builder pattern tests for different Builder pattern functionalities

import { getRelayChainSymbol, type TCurrencyInputWithAmount } from '@paraspell/assets'
import type { TNode } from '@paraspell/sdk-common'
import type { MockInstance } from 'vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../api/IPolkadotApi'
import { DOT_MULTILOCATION } from '../constants'
import { InvalidParameterError } from '../errors'
import { getTransferableAmount, getTransferInfo, verifyEdOnDestination } from '../pallets/assets'
import * as claimAssets from '../pallets/assets/asset-claim'
import * as xcmPallet from '../transfer'
import type {
  TGetXcmFeeEstimateDetail,
  TGetXcmFeeEstimateResult,
  TGetXcmFeeResult,
  TTransferInfo,
  TXcmFeeDetail
} from '../types'
import { Version } from '../types'
import { assertAddressIsString, assertToIsString } from '../utils/builder'
import { Builder } from './Builder'

vi.mock('../transfer', () => ({
  send: vi.fn(),
  transferRelayToPara: vi.fn(),
  dryRun: vi.fn(),
  getXcmFee: vi.fn(),
  getOriginXcmFee: vi.fn(),
  getXcmFeeEstimate: vi.fn(),
  getOriginXcmFeeEstimate: vi.fn()
}))

vi.mock('../pallets/assets', () => ({
  getTransferableAmount: vi.fn(),
  getTransferInfo: vi.fn(),
  verifyEdOnDestination: vi.fn()
}))

vi.mock('../utils/builder', () => ({
  assertToIsString: vi.fn(),
  assertAddressIsString: vi.fn()
}))

const NODE: TNode = 'Acala'
const NODE_2: TNode = 'Hydration'
const AMOUNT = 1000
const CURRENCY = { symbol: 'ACA', amount: AMOUNT }
const CURRENCY_ID = -1n
const ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
const PARA_ID_TO = 1999

describe('Builder', () => {
  const mockApi = {
    init: vi.fn(),
    setApi: vi.fn(),
    callTxMethod: vi.fn(),
    callBatchMethod: vi.fn(),
    setDisconnectAllowed: vi.fn(),
    disconnect: vi.fn(),
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
    vi.resetAllMocks()
    vi.spyOn(mockApi, 'clone').mockReturnValue({
      init: vi.fn(),
      setApi: vi.fn(),
      clone: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown>)
  })

  describe('Para to Para / Para to Relay / Relay to Para  transfer', () => {
    let sendSpy: MockInstance<typeof xcmPallet.send>

    beforeEach(() => {
      sendSpy = vi.spyOn(xcmPallet, 'send').mockResolvedValue(mockExtrinsic)
    })

    it('should initiate a para to para transfer with currency symbol', async () => {
      await Builder(mockApi).from(NODE).to(NODE_2).currency(CURRENCY).address(ADDRESS).build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
        currency: CURRENCY,
        address: ADDRESS,
        to: NODE_2
      })
    })

    it('should initiate a para to para transfer with currency symbol', async () => {
      const tx = await Builder(mockApi)
        .from(NODE)
        .to(NODE_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
        currency: CURRENCY,
        address: ADDRESS,
        to: NODE_2
      })
      expect(tx).toEqual(mockExtrinsic)
    })

    it('should initiate a para to para transfer with custom paraId', async () => {
      await Builder(mockApi)
        .from(NODE)
        .to(NODE_2, PARA_ID_TO)
        .currency(CURRENCY)
        .address(ADDRESS)
        .build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
        currency: CURRENCY,
        address: ADDRESS,
        to: NODE_2,
        paraIdTo: PARA_ID_TO
      })
    })

    it('should initiate a transfer with assetHub address', async () => {
      const ASSET_HUB_ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'
      await Builder(mockApi)
        .from(NODE)
        .to(NODE_2, PARA_ID_TO)
        .currency(CURRENCY)
        .address(ADDRESS)
        .ahAddress(ASSET_HUB_ADDRESS)
        .build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
        currency: CURRENCY,
        address: ADDRESS,
        ahAddress: ASSET_HUB_ADDRESS,
        to: NODE_2,
        paraIdTo: PARA_ID_TO
      })
    })

    it('should initiate a para to para transfer with specified asset ID', async () => {
      const ASSET_ID = 1
      await Builder(mockApi)
        .from(NODE)
        .to(NODE_2, PARA_ID_TO)
        .currency({
          id: ASSET_ID,
          amount: AMOUNT
        })
        .address(ADDRESS)
        .build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
        currency: {
          id: ASSET_ID,
          amount: AMOUNT
        },
        address: ADDRESS,
        to: NODE_2,
        paraIdTo: PARA_ID_TO
      })
    })

    it('should initiate a para to para transfer with overriden version', async () => {
      const version = Version.V2

      await Builder(mockApi)
        .from(NODE)
        .to(NODE_2, PARA_ID_TO)
        .currency(CURRENCY)
        .address(ADDRESS)
        .xcmVersion(version)
        .build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
        currency: CURRENCY,
        address: ADDRESS,
        to: NODE_2,
        paraIdTo: PARA_ID_TO,
        version
      })
    })

    it('should initiate a para to para transfer with currency id', async () => {
      await Builder(mockApi)
        .from(NODE)
        .to(NODE_2)
        .currency({ id: CURRENCY_ID, amount: AMOUNT })
        .address(ADDRESS)
        .build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
        currency: { id: CURRENCY_ID, amount: AMOUNT },
        address: ADDRESS,
        to: NODE_2
      })
    })

    it('should initiate a para to para transfer with fee asset', async () => {
      const currency: TCurrencyInputWithAmount = {
        multiasset: [
          { id: CURRENCY_ID, amount: AMOUNT },
          { symbol: 'USDT', amount: 10000 }
        ]
      }
      await Builder(mockApi).from(NODE).to(NODE_2).currency(currency).address(ADDRESS).build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
        currency,
        address: ADDRESS,
        to: NODE_2
      })
    })

    it('should initiate a para to para transfer with two overriden multi asset', async () => {
      const currency: TCurrencyInputWithAmount = {
        multiasset: [
          {
            id: {
              Concrete: {
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
              }
            },

            fun: {
              Fungible: '102928'
            }
          },
          {
            id: {
              Concrete: {
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
              }
            },
            fun: {
              Fungible: '38482'
            }
          }
        ]
      }

      await Builder(mockApi).from(NODE).to(NODE_2).currency(currency).address(ADDRESS).build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
        currency,
        address: ADDRESS,
        to: NODE_2
      })
    })

    it('should initiate a para to relay transfer with currency symbol', async () => {
      const currency = getRelayChainSymbol(NODE)

      await Builder(mockApi)
        .from(NODE)
        .to('Polkadot')
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
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
        .from(NODE)
        .to('Polkadot')
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
        to: 'Polkadot',
        currency: {
          symbol: getRelayChainSymbol(NODE),
          amount: AMOUNT
        },
        address: ADDRESS
      })
      expect(tx).toEqual(mockExtrinsic)
    })

    it('should initiate a para to relay transfer with currency symbol', async () => {
      const currency = getRelayChainSymbol(NODE)

      await Builder(mockApi)
        .from(NODE)
        .to('Polkadot')
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
        to: 'Polkadot',
        currency: {
          symbol: currency,
          amount: AMOUNT
        },
        address: ADDRESS
      })
    })

    it('should initiate a para to relay transfer with fee asset', async () => {
      const currency: TCurrencyInputWithAmount = {
        multiasset: [
          { symbol: 'DOT', amount: AMOUNT },
          { symbol: 'USDT', amount: 10000 }
        ]
      }
      const feeAsset = {
        symbol: 'USDT'
      }

      await Builder(mockApi)
        .from(NODE)
        .to('Polkadot')
        .currency(currency)
        .feeAsset(feeAsset)
        .address(ADDRESS)
        .build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
        to: 'Polkadot',
        currency,
        feeAsset,
        address: ADDRESS
      })
    })

    it('should initiate a para to relay transfer with overriden version', async () => {
      const currency = getRelayChainSymbol(NODE)
      const version = Version.V2

      await Builder(mockApi)
        .from(NODE)
        .to('Polkadot')
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .xcmVersion(version)
        .build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
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
      const currency: TCurrencyInputWithAmount = {
        multiasset: [
          { symbol: 'DOT', amount: AMOUNT },
          { symbol: 'USDT', amount: 10000 }
        ]
      }
      const version = Version.V2
      const feeAsset = {
        symbol: 'USDT'
      }

      await Builder(mockApi)
        .from(NODE)
        .to('Polkadot')
        .currency(currency)
        .feeAsset(feeAsset)
        .address(ADDRESS)
        .xcmVersion(version)
        .build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
        to: 'Polkadot',
        currency: currency,
        feeAsset,
        address: ADDRESS,
        version
      })
    })

    it('should request a para to para transfer api call with currency id', async () => {
      await Builder(mockApi)
        .from(NODE)
        .to(NODE_2)
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .build()

      expect(sendSpy).toHaveBeenCalledTimes(1)
    })

    it('should initiate a para to relay transfer using batching', async () => {
      await Builder(mockApi)
        .from(NODE)
        .to('Polkadot')
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .addToBatch()
        .from(NODE)
        .to('Polkadot')
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .addToBatch()
        .buildBatch()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
        to: 'Polkadot',
        currency: {
          symbol: getRelayChainSymbol(NODE),
          amount: AMOUNT
        },
        address: ADDRESS
      })

      expect(sendSpy).toHaveBeenCalledTimes(2)
    })

    it('should initiate a para to para transfer using batching', async () => {
      await Builder(mockApi)
        .from(NODE)
        .to(NODE_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .addToBatch()
        .buildBatch()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
        to: NODE_2,
        currency: CURRENCY,
        address: ADDRESS
      })
    })

    it('should initiate a double para to para transfer using batching', async () => {
      await Builder(mockApi)
        .from(NODE)
        .to(NODE_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .addToBatch()
        .from(NODE)
        .to(NODE_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .addToBatch()
        .buildBatch()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: NODE,
        to: NODE_2,
        currency: CURRENCY,
        address: ADDRESS
      })

      expect(sendSpy).toHaveBeenCalledTimes(2)
    })

    it('should throw if trying to build when transactions are batched', async () => {
      await expect(
        Builder(mockApi)
          .from(NODE)
          .to(NODE_2)
          .currency(CURRENCY)
          .address(ADDRESS)
          .addToBatch()
          .from(NODE)
          .to(NODE_2)
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
        .to(NODE)
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: 'Polkadot',
        to: NODE,
        currency: { symbol: 'DOT', amount: AMOUNT },
        address: ADDRESS
      })
    })

    it('should initiate a relay to para transfer with custom paraId', async () => {
      await Builder(mockApi)
        .from('Polkadot')
        .to(NODE, PARA_ID_TO)
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: 'Polkadot',
        to: NODE,
        currency: { symbol: 'DOT', amount: AMOUNT },
        address: ADDRESS,
        paraIdTo: PARA_ID_TO
      })
    })

    it('should initiate a relay to para transfer with overriden version', async () => {
      const version = Version.V2

      await Builder(mockApi)
        .from('Polkadot')
        .to(NODE, PARA_ID_TO)
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .xcmVersion(version)
        .build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: 'Polkadot',
        to: NODE,
        currency: { symbol: 'DOT', amount: AMOUNT },
        address: ADDRESS,
        paraIdTo: PARA_ID_TO,
        version
      })
    })

    it('should initiate a relay to para transfer with overriden version', async () => {
      const version = Version.V2

      await Builder(mockApi)
        .from('Polkadot')
        .to(NODE, PARA_ID_TO)
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .xcmVersion(version)
        .build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: 'Polkadot',
        to: NODE,
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
        .to(NODE_2)
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .build()

      expect(sendSpy).toHaveBeenCalledTimes(1)
    })

    it('should initiate a double relay to para transfer using batching', async () => {
      await Builder(mockApi)
        .from('Polkadot')
        .to(NODE_2)
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .addToBatch()
        .from('Polkadot')
        .to(NODE_2)
        .currency({ symbol: 'DOT', amount: AMOUNT })
        .address(ADDRESS)
        .addToBatch()
        .buildBatch()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        from: 'Polkadot',
        to: NODE_2,
        currency: { symbol: 'DOT', amount: AMOUNT },
        address: ADDRESS
      })

      expect(sendSpy).toHaveBeenCalledTimes(2)
    })

    it('should disconnect the api after building', async () => {
      const disconnectAllowedSpy = vi.spyOn(mockApi, 'setDisconnectAllowed')
      const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

      const builder = Builder(mockApi)
        .from('Polkadot')
        .to(NODE_2)
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
      const spy = vi.spyOn(claimAssets, 'claimAssets').mockResolvedValue(mockExtrinsic)
      await Builder(mockApi).claimFrom(NODE).fungible([]).account(ADDRESS).build()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith({
        api: mockApi,
        node: NODE,
        multiAssets: [],
        address: ADDRESS
      })
    })

    it('should create a claim asset tx with valid output', async () => {
      const spy = vi.spyOn(claimAssets, 'claimAssets').mockResolvedValue({
        method: 'claim',
        args: []
      })
      const tx = await Builder(mockApi)
        .claimFrom(NODE)
        .fungible([])
        .account(ADDRESS)
        .xcmVersion(Version.V3)
        .build()

      expect(tx).toHaveProperty('method')
      expect(tx).toHaveProperty('args')
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should disconnect the api after building', async () => {
      const spy = vi.spyOn(claimAssets, 'claimAssets').mockResolvedValue({
        method: 'claim',
        args: []
      })

      const disconnectAllowedSpy = vi.spyOn(mockApi, 'setDisconnectAllowed')
      const disconnectSpy = vi.spyOn(mockApi, 'disconnect')

      const builder = Builder(mockApi).claimFrom(NODE).fungible([]).account(ADDRESS)

      const tx = await builder.build()
      expect(tx).toBeDefined()

      await builder.disconnect()

      expect(disconnectAllowedSpy).not.toHaveBeenCalled()
      expect(disconnectSpy).toHaveBeenCalledWith(true)
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Dry run', () => {
    it('should throw when destination is a Multi-Location (dryRun)', async () => {
      await expect(
        Builder(mockApi)
          .from(NODE)
          .to(DOT_MULTILOCATION)
          .currency(CURRENCY)
          .address(ADDRESS)
          .senderAddress('alice')
          .dryRun()
      ).rejects.toThrow(InvalidParameterError)
    })

    it('should throw when address is a Multi-Location (dryRun)', async () => {
      await expect(
        Builder(mockApi)
          .from(NODE)
          .to(NODE_2)
          .currency(CURRENCY)
          .address(DOT_MULTILOCATION)
          .senderAddress('alice')
          .dryRun()
      ).rejects.toThrow(InvalidParameterError)
    })

    it('should dry run a normal transfer', async () => {
      const spy = vi.mocked(xcmPallet.dryRun).mockResolvedValue({
        origin: {
          success: true,
          fee: 1000n,
          forwardedXcms: [],
          destParaId: 0,
          currency: 'DOT'
        }
      })

      const SENDER_ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'

      const result = await Builder(mockApi)
        .from(NODE)
        .to(NODE_2)
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
          currency: 'DOT'
        }
      })
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Fee calculation', () => {
    it('should fetch XCM fee ', async () => {
      const spy = vi.mocked(xcmPallet.getXcmFee).mockResolvedValue({} as TGetXcmFeeResult)

      const SENDER = 'sender-address'

      const result = await Builder(mockApi)
        .from(NODE)
        .to(NODE_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER)
        .getXcmFee()

      expect(result).toEqual({})
      expect(spy).toHaveBeenCalledTimes(1)
      expect(assertToIsString).toHaveBeenCalledWith(NODE_2)
      expect(assertAddressIsString).toHaveBeenCalledWith(ADDRESS)
    })

    it('should fetch origin XCM fee', async () => {
      const spy = vi.mocked(xcmPallet.getOriginXcmFee).mockResolvedValue({} as TXcmFeeDetail)

      const SENDER = 'sender-address'

      const result = await Builder(mockApi)
        .from(NODE)
        .to(NODE_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER)
        .getOriginXcmFee()

      expect(result).toEqual({})
      expect(spy).toHaveBeenCalledTimes(1)
      expect(assertToIsString).toHaveBeenCalledWith(NODE_2)
    })

    it('should fetch XCM fee estimate', async () => {
      const spy = vi
        .mocked(xcmPallet.getXcmFeeEstimate)
        .mockResolvedValue({} as TGetXcmFeeEstimateResult)

      const SENDER = 'sender-address'

      const result = await Builder(mockApi)
        .from(NODE)
        .to(NODE_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER)
        .getXcmFeeEstimate()

      expect(result).toEqual({})
      expect(spy).toHaveBeenCalledTimes(1)
      expect(assertToIsString).toHaveBeenCalledWith(NODE_2)
      expect(assertAddressIsString).toHaveBeenCalledWith(ADDRESS)
    })

    it('should fetch origin XCM fee estimate', async () => {
      const spy = vi
        .mocked(xcmPallet.getOriginXcmFeeEstimate)
        .mockResolvedValue({} as TGetXcmFeeEstimateDetail)

      const SENDER = 'sender-address'

      const result = await Builder(mockApi)
        .from(NODE)
        .to(NODE_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER)
        .getOriginXcmFeeEstimate()

      expect(result).toEqual({})
      expect(spy).toHaveBeenCalledTimes(1)
      expect(assertToIsString).toHaveBeenCalledWith(NODE_2)
    })

    it('should fetch transferable amount', async () => {
      const amount = 1000n

      const spy = vi.mocked(getTransferableAmount).mockResolvedValue(amount)

      const SENDER = 'sender-address'

      const result = await Builder(mockApi)
        .from(NODE)
        .to(NODE_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER)
        .getTransferableAmount()

      expect(result).toEqual(amount)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should verify ed on destination', async () => {
      const mockResult = true

      const spy = vi.mocked(verifyEdOnDestination).mockResolvedValue(mockResult)

      const SENDER = 'sender-address'

      const result = await Builder(mockApi)
        .from(NODE)
        .to(NODE_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER)
        .verifyEdOnDestination()

      expect(result).toEqual(mockResult)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(assertAddressIsString).toHaveBeenCalledWith(ADDRESS)
      expect(assertToIsString).toHaveBeenCalledWith(NODE_2)
    })

    it('should fetch tansfer info', async () => {
      const spy = vi.mocked(getTransferInfo).mockResolvedValue({} as TTransferInfo)

      const SENDER = 'sender-address'

      const result = await Builder(mockApi)
        .from(NODE)
        .to(NODE_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .senderAddress(SENDER)
        .getTransferInfo()

      expect(result).toEqual({})
      expect(spy).toHaveBeenCalledTimes(1)
      expect(assertAddressIsString).toHaveBeenCalledWith(ADDRESS)
      expect(assertToIsString).toHaveBeenCalledWith(NODE_2)
    })
  })
})
