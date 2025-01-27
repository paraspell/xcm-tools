// Contains builder pattern tests for different Builder pattern functionalities

import type { MockInstance } from 'vitest'
import { vi, describe, expect, it, beforeEach } from 'vitest'
import type { TCurrencyInputWithAmount } from '../types'
import { Version, type TNode } from '../types'
import * as xcmPallet from '../transfer'
import { getRelayChainSymbol } from '../pallets/assets'
import { Builder } from './Builder'
import * as claimAssets from '../pallets/assets/asset-claim'
import type { IPolkadotApi } from '../api/IPolkadotApi'

vi.mock('../transfer', () => ({
  send: vi.fn(),
  transferRelayToPara: vi.fn(),
  getDryRun: vi.fn()
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
        origin: NODE,
        currency: CURRENCY,
        address: ADDRESS,
        destination: NODE_2
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
        origin: NODE,
        currency: CURRENCY,
        address: ADDRESS,
        destination: NODE_2
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
        origin: NODE,
        currency: CURRENCY,
        address: ADDRESS,
        destination: NODE_2,
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
        origin: NODE,
        currency: {
          id: ASSET_ID,
          amount: AMOUNT
        },
        address: ADDRESS,
        destination: NODE_2,
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
        origin: NODE,
        currency: CURRENCY,
        address: ADDRESS,
        destination: NODE_2,
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
        origin: NODE,
        currency: { id: CURRENCY_ID, amount: AMOUNT },
        address: ADDRESS,
        destination: NODE_2
      })
    })

    it('should initiate a para to para transfer with fee asset', async () => {
      const currency: TCurrencyInputWithAmount = {
        multiasset: [
          { id: CURRENCY_ID, amount: AMOUNT },
          { symbol: 'USDT', amount: 10000, isFeeAsset: true }
        ]
      }
      await Builder(mockApi).from(NODE).to(NODE_2).currency(currency).address(ADDRESS).build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        origin: NODE,
        currency,
        address: ADDRESS,
        destination: NODE_2
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
            isFeeAsset: true,
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
        origin: NODE,
        currency,
        address: ADDRESS,
        destination: NODE_2
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
        origin: NODE,
        destination: 'Polkadot',
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
        origin: NODE,
        destination: 'Polkadot',
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
        origin: NODE,
        destination: 'Polkadot',
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
          { symbol: 'USDT', amount: 10000, isFeeAsset: true }
        ]
      }

      await Builder(mockApi).from(NODE).to('Polkadot').currency(currency).address(ADDRESS).build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        origin: NODE,
        destination: 'Polkadot',
        currency,
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
        origin: NODE,
        destination: 'Polkadot',
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
          { symbol: 'USDT', amount: 10000, isFeeAsset: true }
        ]
      }
      const version = Version.V2

      await Builder(mockApi)
        .from(NODE)
        .to('Polkadot')
        .currency(currency)
        .address(ADDRESS)
        .xcmVersion(version)
        .build()

      expect(sendSpy).toHaveBeenCalledWith({
        api: mockApi,
        origin: NODE,
        destination: 'Polkadot',
        currency: currency,
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
        origin: NODE,
        destination: 'Polkadot',
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
        origin: NODE,
        destination: NODE_2,
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
        origin: NODE,
        destination: NODE_2,
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
        origin: 'Polkadot',
        destination: NODE,
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
        origin: 'Polkadot',
        destination: NODE,
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
        origin: 'Polkadot',
        destination: NODE,
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
        origin: 'Polkadot',
        destination: NODE,
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
        origin: 'Polkadot',
        destination: NODE_2,
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
      expect(disconnectSpy).toHaveBeenCalledWith(true)
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
    it('should dry run a normal transfer', async () => {
      const spy = vi.mocked(xcmPallet.getDryRun).mockResolvedValue({
        success: true,
        fee: 1000n
      })

      const SENDER_ADDRESS = '23sxrMSmaUMqe2ufSJg8U3Y8kxHfKT67YbubwXWFazpYi7w6'

      const result = await Builder(mockApi)
        .from(NODE)
        .to(NODE_2)
        .currency(CURRENCY)
        .address(ADDRESS)
        .dryRun(SENDER_ADDRESS)

      expect(result).toEqual({
        success: true,
        fee: 1000n
      })
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })
})
