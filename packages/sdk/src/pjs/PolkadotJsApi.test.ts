import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { StorageKey } from '@polkadot/types'
import { u32 } from '@polkadot/types'
import type { AnyTuple, Codec } from '@polkadot/types/types'
import PolkadotJsApi from './PolkadotJsApi'
import type { TSerializedApiCall, TMultiLocation } from '../types'
import type { Extrinsic, TPjsApi } from '../pjs/types'
import * as utils from '../utils'
import type { VoidFn } from '@polkadot/api/types'

describe('PolkadotJsApi', () => {
  let polkadotApi: PolkadotJsApi
  let mockApiPromise: TPjsApi

  beforeEach(async () => {
    polkadotApi = new PolkadotJsApi()
    mockApiPromise = {
      createType: vi.fn().mockReturnValue({
        toHex: vi.fn().mockReturnValue('0x1234567890abcdef')
      }),
      registry: {},
      rpc: {
        state: {
          getStorage: vi
            .fn()
            .mockResolvedValue({ toHex: vi.fn().mockReturnValue('0x1234567890abcdef') })
        }
      },
      tx: {
        xTokens: {
          transfer: vi.fn().mockReturnValue('mocked_extrinsic')
        },
        utility: {
          batchAll: vi.fn().mockReturnValue('mocked_utility_extrinsic')
        }
      },
      query: {
        system: {
          account: vi.fn().mockResolvedValue({ data: { free: { toBigInt: () => BigInt(2000) } } })
        },
        assets: {
          account: vi.fn().mockResolvedValue({ toJSON: () => ({ balance: '3000' }) })
        },
        balances: {
          account: vi.fn()
        },
        foreignAssets: {
          account: vi.fn()
        },
        tokens: {
          accounts: Object.assign(vi.fn(), {
            entries: vi.fn()
          })
        }
      },
      disconnect: vi.fn()
    } as unknown as TPjsApi
    polkadotApi.setApi(mockApiPromise)
    await polkadotApi.init('Acala')
  })

  describe('setApi and getApi', () => {
    it('should set and get the api', async () => {
      const polkadotApi = new PolkadotJsApi()
      const newApi = {} as TPjsApi
      polkadotApi.setApi(newApi)
      await polkadotApi.init('Acala')
      const api = polkadotApi.getApi()
      expect(api).toBe(newApi)
    })
  })

  describe('init', () => {
    it('should set api to _api when _api is defined', async () => {
      const polkadotApi = new PolkadotJsApi()
      const mockApi = {} as TPjsApi
      polkadotApi.setApi(mockApi)
      await polkadotApi.init('Acala')
      expect(polkadotApi.getApi()).toBe(mockApi)
    })

    it('should create api instance when _api is undefined', async () => {
      const polkadotApi = new PolkadotJsApi()
      polkadotApi.setApi(undefined)
      const mockCreateApiInstanceForNode = vi
        .spyOn(utils, 'createApiInstanceForNode')
        .mockResolvedValue(mockApiPromise)

      await polkadotApi.init('Acala')

      expect(mockCreateApiInstanceForNode).toHaveBeenCalledWith(polkadotApi, 'Acala')
      expect(polkadotApi.getApi()).toBe(mockApiPromise)

      mockCreateApiInstanceForNode.mockRestore()
    })
  })

  describe('createAccountId', () => {
    it('should return a hex string representation of the AccountId', () => {
      const address = '5F3sa2TJAWMqDhXG6jhV4N8ko9gKph2TGpR67TgeSmDTZyDg'

      const spy = vi.spyOn(mockApiPromise, 'createType')

      const result = polkadotApi.createAccountId(address)

      expect(spy).toHaveBeenCalledWith('AccountId32', address)
      expect(result).toBe('0x1234567890abcdef')
    })
  })

  describe('callTxMethod', () => {
    it('should create an extrinsic with the provided module, section, and parameters', () => {
      const serializedCall: TSerializedApiCall = {
        module: 'XTokens',
        section: 'transfer',
        parameters: { beneficiary: 'recipient_address', amount: 1000 }
      }

      const result = polkadotApi.callTxMethod(serializedCall)

      expect(mockApiPromise.tx.xTokens.transfer).toHaveBeenCalledWith('recipient_address', 1000)
      expect(result).toBe('mocked_extrinsic')
    })

    it('should handle the Utility module differently', () => {
      const serializedCall: TSerializedApiCall = {
        module: 'Utility',
        section: 'batch_all',
        parameters: { calls: ['call1', 'call2'] }
      }

      const result = polkadotApi.callTxMethod(serializedCall)

      expect(mockApiPromise.tx.utility.batchAll).toHaveBeenCalledWith('call1', 'call2')
      expect(result).toBe('mocked_utility_extrinsic')
    })
  })

  describe('calculateTransactionFee', () => {
    it('should return the partial fee as bigint', async () => {
      const mockExtrinsic = {
        paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toBigInt: () => BigInt(1000) } })
      } as unknown as Extrinsic
      const address = 'some_address'

      const spy = vi.spyOn(mockExtrinsic, 'paymentInfo')

      const fee = await polkadotApi.calculateTransactionFee(mockExtrinsic, address)

      expect(spy).toHaveBeenCalledWith(address)
      expect(fee).toBe(BigInt(1000))
    })
  })

  describe('getBalanceNative', () => {
    it('should return the free balance as bigint', async () => {
      const address = 'some_address'

      const balance = await polkadotApi.getBalanceNative(address)

      expect(mockApiPromise.query.system.account).toHaveBeenCalledWith(address)
      expect(balance).toBe(BigInt(2000))
    })
  })

  describe('getBalanceForeign', () => {
    it('should return the foreign balance as bigint when balance exists', async () => {
      const address = 'some_address'
      const id = '1'
      const parsedId = new u32(mockApiPromise.registry, id)

      const balance = await polkadotApi.getBalanceForeignPolkadotXcm(address, id)

      expect(mockApiPromise.query.assets.account).toHaveBeenCalledWith(parsedId, address)
      expect(balance).toBe(BigInt(3000))
    })

    it('should return null when balance does not exist', async () => {
      const address = 'some_address'
      const id = '1'
      const parsedId = new u32(mockApiPromise.registry, id)

      const mockResponse = {
        toJSON: () => ({})
      } as unknown as Codec

      vi.mocked(mockApiPromise.query.assets.account).mockResolvedValue(
        mockResponse as unknown as VoidFn
      )

      const balance = await polkadotApi.getBalanceForeignPolkadotXcm(address, id)

      expect(mockApiPromise.query.assets.account).toHaveBeenCalledWith(parsedId, address)
      expect(balance).toBe(BigInt(0))
    })

    describe('getMythosForeignBalance', () => {
      it('should return the Mythos foreign balance as bigint when balance exists', async () => {
        const address = 'some_address'

        const mockResponse = {
          toJSON: () => ({ free: '4000' })
        } as unknown as Codec

        vi.mocked(mockApiPromise.query.balances.account).mockResolvedValue(
          mockResponse as unknown as VoidFn
        )

        const balance = await polkadotApi.getMythosForeignBalance(address)

        expect(mockApiPromise.query.balances.account).toHaveBeenCalledWith(address)
        expect(balance).toBe(BigInt(4000))
      })

      it('should return null when free balance does not exist', async () => {
        const address = 'some_address'

        const mockResponse = {
          toJSON: () => ({})
        } as unknown as Codec

        vi.mocked(mockApiPromise.query.balances.account).mockResolvedValue(
          mockResponse as unknown as VoidFn
        )

        const balance = await polkadotApi.getMythosForeignBalance(address)

        expect(mockApiPromise.query.balances.account).toHaveBeenCalledWith(address)
        expect(balance).toBe(BigInt(0))
      })
    })

    describe('getAssetHubForeignBalance', () => {
      const multiLocation: TMultiLocation = {
        parents: 1,
        interior: {
          X1: {
            Parachain: 1000
          }
        }
      }
      it('should return the balance as bigint when balance exists', async () => {
        const address = 'some_address'

        const mockResponse = {
          toJSON: () => ({ balance: '5000' })
        } as unknown as Codec

        vi.mocked(mockApiPromise.query.foreignAssets.account).mockResolvedValue(
          mockResponse as unknown as VoidFn
        )

        const balance = await polkadotApi.getAssetHubForeignBalance(address, multiLocation)

        expect(mockApiPromise.query.foreignAssets.account).toHaveBeenCalledWith(
          multiLocation,
          address
        )
        expect(balance).toBe(BigInt(5000))
      })

      it('should return 0 when balance does not exist', async () => {
        const address = 'some_address'

        const mockResponse = {
          toJSON: () => ({})
        } as unknown as Codec

        vi.mocked(mockApiPromise.query.foreignAssets.account).mockResolvedValue(
          mockResponse as unknown as VoidFn
        )

        const balance = await polkadotApi.getAssetHubForeignBalance(address, multiLocation)

        expect(mockApiPromise.query.foreignAssets.account).toHaveBeenCalledWith(
          multiLocation,
          address
        )
        expect(balance).toBe(BigInt(0))
      })
    })
  })

  describe('getBalanceForeignBifrost', () => {
    it('should return the balance when asset matches currencySelection', async () => {
      const address = 'some_address'
      const mockResponse = {
        free: { toString: () => '6000' }
      } as unknown as VoidFn

      vi.mocked(mockApiPromise.query.tokens.accounts).mockResolvedValue(mockResponse)

      const balance = await polkadotApi.getBalanceForeignBifrost(address, { symbol: 'DOT' })

      expect(mockApiPromise.query.tokens.accounts).toHaveBeenCalledWith(address, {
        Token: 'DOT'
      })
      expect(balance).toBe(BigInt(6000))
    })

    it('should return null when no matching asset found', async () => {
      const address = 'some_address'

      const mockResponse = {
        free: { toString: () => '0' }
      } as unknown as VoidFn

      vi.mocked(mockApiPromise.query.tokens.accounts).mockResolvedValue(mockResponse)

      const balance = await polkadotApi.getBalanceForeignBifrost(address, { symbol: 'DOT' })

      expect(mockApiPromise.query.tokens.accounts).toHaveBeenCalledWith(address, {
        Token: 'DOT'
      })
      expect(balance).toBe(BigInt(0))
    })
  })

  describe('getBalanceForeignXTokens', () => {
    it('should return the balance when asset matches symbolOrId', async () => {
      const address = 'some_address'
      const mockEntry = [
        {
          args: [address, { toString: () => 'DOT', toHuman: () => ({}) }]
        },
        { free: { toString: () => '6000' } }
      ] as unknown as [StorageKey<AnyTuple>, Codec]

      vi.mocked(mockApiPromise.query.tokens.accounts.entries).mockResolvedValue([mockEntry])

      const balance = await polkadotApi.getBalanceForeignXTokens(address, {
        symbol: 'DOT',
        assetId: '1'
      })
      expect(mockApiPromise.query.tokens.accounts.entries).toHaveBeenCalledWith(address)
      expect(balance).toBe(BigInt(6000))
    })

    it('should return null when no matching asset found', async () => {
      const address = 'some_address'

      vi.mocked(mockApiPromise.query.tokens.accounts.entries).mockResolvedValue([])

      const balance = await polkadotApi.getBalanceForeignXTokens(address, {
        symbol: 'DOT',
        assetId: '1'
      })
      expect(mockApiPromise.query.tokens.accounts.entries).toHaveBeenCalledWith(address)
      expect(balance).toBe(BigInt(0))
    })

    it('should return balance when assetItem is object by symbol', async () => {
      const address = 'some_address'
      const mockEntry = [
        {
          args: [
            address,
            {
              toString: () => '',
              toHuman: () => ({
                ForeignToken: 'DOT'
              })
            }
          ]
        },
        { free: { toString: () => '6000' } }
      ] as unknown as [StorageKey<AnyTuple>, Codec]

      vi.mocked(mockApiPromise.query.tokens.accounts.entries).mockResolvedValue([mockEntry])

      const balance = await polkadotApi.getBalanceForeignXTokens(address, {
        symbol: 'DOT',
        assetId: '1'
      })
      expect(mockApiPromise.query.tokens.accounts.entries).toHaveBeenCalledWith(address)
      expect(balance).toBe(BigInt(6000))
    })

    it('should return balance when assetItem is object by id', async () => {
      const address = 'some_address'
      const mockEntry = [
        {
          args: [
            address,
            {
              toString: () => '',
              toHuman: () => ({
                ForeignToken: '1'
              })
            }
          ]
        },
        { free: { toString: () => '6000' } }
      ] as unknown as [StorageKey<AnyTuple>, Codec]

      vi.mocked(mockApiPromise.query.tokens.accounts.entries).mockResolvedValue([mockEntry])

      const balance = await polkadotApi.getBalanceForeignXTokens(address, {
        symbol: 'DOT',
        assetId: '1'
      })
      expect(mockApiPromise.query.tokens.accounts.entries).toHaveBeenCalledWith(address)
      expect(balance).toBe(BigInt(6000))
    })
  })

  describe('getBalanceForeignMoonbeam', () => {
    it('should return the balance when asset matches assetId', async () => {
      const address = 'some_address'
      const mockResponse = {
        toJSON: () => ({ balance: '7000' })
      } as unknown as VoidFn

      vi.mocked(mockApiPromise.query.assets.account).mockResolvedValue(mockResponse)

      const balance = await polkadotApi.getBalanceForeignAssetsAccount(address, BigInt(1))

      expect(mockApiPromise.query.assets.account).toHaveBeenCalledWith(BigInt(1), address)
      expect(balance).toBe(BigInt(7000))
    })

    it('should return null when balance does not exist', async () => {
      const address = 'some_address'
      const mockResponse = {
        toJSON: () => ({})
      } as unknown as VoidFn

      vi.mocked(mockApiPromise.query.assets.account).mockResolvedValue(mockResponse)

      const balance = await polkadotApi.getBalanceForeignAssetsAccount(address, 1)

      expect(mockApiPromise.query.assets.account).toHaveBeenCalledWith(1, address)
      expect(balance).toEqual(BigInt(0))
    })
  })

  describe('clone', () => {
    it('should return a new instance of PolkadotJsApi', () => {
      const cloneApi = polkadotApi.clone()
      expect(cloneApi).toBeInstanceOf(PolkadotJsApi)
      expect(cloneApi).not.toBe(polkadotApi)
    })
  })

  describe('getFromStorage', () => {
    it('should return the value as hex string', async () => {
      const key = 'some'
      const mockResponse = {
        toHex: vi.fn().mockReturnValue('0x1234567890abcdef')
      } as unknown as VoidFn

      vi.mocked(mockApiPromise.rpc.state.getStorage).mockResolvedValue(mockResponse)

      const result = await polkadotApi.getFromStorage(key)

      expect(mockApiPromise.rpc.state.getStorage).toHaveBeenCalledWith(key)

      expect(result).toBe('0x1234567890abcdef')
    })
  })

  describe('createApiForNode', () => {
    it('should create a new PolkadotJsApi instance and call init with the provided node', async () => {
      const node = 'Acala'
      const mockCreateApiInstanceForNode = vi
        .spyOn(utils, 'createApiInstanceForNode')
        .mockResolvedValue(mockApiPromise)

      const newApi = await polkadotApi.createApiForNode(node)

      expect(newApi).toBeInstanceOf(PolkadotJsApi)
      expect(newApi.getApi()).toBe(mockApiPromise)

      mockCreateApiInstanceForNode.mockRestore()
    })
  })

  describe('disconnect', () => {
    it('should disconnect the api when _api is a string', async () => {
      const mockDisconnect = vi.spyOn(mockApiPromise, 'disconnect').mockResolvedValue()

      polkadotApi.setApi('api')
      await polkadotApi.disconnect()

      expect(mockDisconnect).toHaveBeenCalled()

      mockDisconnect.mockRestore()
    })

    it('should disconnect the api when _api is not provided', async () => {
      const mockDisconnect = vi.spyOn(mockApiPromise, 'disconnect').mockResolvedValue()

      polkadotApi.setApi(undefined)
      await polkadotApi.disconnect()

      expect(mockDisconnect).toHaveBeenCalled()

      mockDisconnect.mockRestore()
    })

    it('should not disconnect the api when _api is provided', async () => {
      const mockDisconnect = vi.spyOn(mockApiPromise, 'disconnect').mockResolvedValue()

      polkadotApi.setApi(mockApiPromise)
      await polkadotApi.disconnect()

      expect(mockDisconnect).not.toHaveBeenCalled()

      mockDisconnect.mockRestore()
    })
  })

  describe('getBalanceNativeAcala', () => {
    it('should return the free balance as bigint', async () => {
      polkadotApi.setApi(mockApiPromise)
      const balance = await polkadotApi.getBalanceNativeAcala('some_address', 'AUSD')

      expect(mockApiPromise.query.tokens.accounts).toHaveBeenCalledOnce()
      expect(balance).toBe(BigInt(0))
    })
  })
})
