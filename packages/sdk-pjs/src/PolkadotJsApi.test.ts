import * as sdkCore from '@paraspell/sdk-core'
import { BatchMode, type TMultiLocation, type TSerializedApiCall } from '@paraspell/sdk-core'
import type { ApiPromise } from '@polkadot/api'
import type { VoidFn } from '@polkadot/api/types'
import type { StorageKey } from '@polkadot/types'
import { u32 } from '@polkadot/types'
import type { AnyTuple, Codec } from '@polkadot/types/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PolkadotJsApi from './PolkadotJsApi'
import type { Extrinsic, TPjsApi } from './types'

vi.mock('@paraspell/sdk-core', async importOriginal => {
  return {
    ...(await importOriginal<typeof import('@paraspell/sdk-core')>()),
    computeFeeFromDryRunPjs: vi.fn().mockReturnValue(1000n),
    createApiInstanceForNodePjs: vi.fn().mockResolvedValue({} as ApiPromise),
    resolveModuleError: vi.fn().mockReturnValue('ModuleError')
  }
})

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
      call: {
        dryRunApi: {
          dryRunCall: vi.fn()
        }
      },
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
          batch: vi.fn().mockReturnValue('mocked_utility_extrinsic'),
          batchAll: vi.fn().mockReturnValue('mocked_utility_extrinsic')
        }
      },
      query: {
        system: {
          account: vi.fn().mockResolvedValue({ data: { free: { toBigInt: () => 2000n } } })
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
        },
        ormlTokens: {
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
        .spyOn(sdkCore, 'createApiInstanceForNode')
        .mockResolvedValue(mockApiPromise)

      await polkadotApi.init('Acala')

      expect(mockCreateApiInstanceForNode).toHaveBeenCalledWith(polkadotApi, 'Acala')
      expect(polkadotApi.getApi()).toBe(mockApiPromise)

      mockCreateApiInstanceForNode.mockRestore()
    })
  })

  describe('accountToHex', () => {
    it('should return the hex address as hex string', () => {
      const address = '0x1234567890abcdef'

      const result = polkadotApi.accountToHex(address)

      expect(result).toBe(address)
    })

    it('should return the address as hex string without prefix', () => {
      const address = '7LgutW4uapAUb9XtHjsRmemvWmkyfukPSw1Sr5LwqqUGTKjf'
      const result = polkadotApi.accountToHex(address, false)
      expect(result).toBe('88ca48e3e1d0f1c50bd6b504e1312d21f5bd45ed147e3c30c77eb5e4d63bdc63')
    })

    it('should return the address as hex string with prefiex', () => {
      const address = '7LgutW4uapAUb9XtHjsRmemvWmkyfukPSw1Sr5LwqqUGTKjf'
      const result = polkadotApi.accountToHex(address, true)
      expect(result).toBe('0x88ca48e3e1d0f1c50bd6b504e1312d21f5bd45ed147e3c30c77eb5e4d63bdc63')
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
  })

  describe('callBatchMethod', () => {
    it('should create a batch extrinsic with the provided calls and BATCH mode', () => {
      const calls = ['call1', 'call2'] as unknown as Extrinsic[]
      const mode = BatchMode.BATCH

      const result = polkadotApi.callBatchMethod(calls, mode)

      expect(mockApiPromise.tx.utility.batch).toHaveBeenCalledWith(calls)
      expect(result).toBe('mocked_utility_extrinsic')
    })

    it('should create a batch_all extrinsic with the provided calls and BATCH_ALL mode', () => {
      const calls = ['call1', 'call2'] as unknown as Extrinsic[]
      const mode = BatchMode.BATCH_ALL

      const result = polkadotApi.callBatchMethod(calls, mode)

      expect(mockApiPromise.tx.utility.batchAll).toHaveBeenCalledWith(calls)
      expect(result).toBe('mocked_utility_extrinsic')
    })
  })

  describe('calculateTransactionFee', () => {
    it('should return the partial fee as bigint', async () => {
      const mockExtrinsic = {
        paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toBigInt: () => 1000n } })
      } as unknown as Extrinsic
      const address = 'some_address'

      const spy = vi.spyOn(mockExtrinsic, 'paymentInfo')

      const fee = await polkadotApi.calculateTransactionFee(mockExtrinsic, address)

      expect(spy).toHaveBeenCalledWith(address)
      expect(fee).toBe(1000n)
    })
  })

  describe('getBalanceNative', () => {
    it('should return the free balance as bigint', async () => {
      const address = 'some_address'

      const balance = await polkadotApi.getBalanceNative(address)

      expect(mockApiPromise.query.system.account).toHaveBeenCalledWith(address)
      expect(balance).toBe(2000n)
    })
  })

  describe('getBalanceForeign', () => {
    it('should return the foreign balance as bigint when balance exists', async () => {
      const address = 'some_address'
      const id = '1'
      const parsedId = new u32(mockApiPromise.registry, id)

      const balance = await polkadotApi.getBalanceForeignPolkadotXcm(address, id)

      expect(mockApiPromise.query.assets.account).toHaveBeenCalledWith(parsedId, address)
      expect(balance).toBe(3000n)
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
      expect(balance).toBe(0n)
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
        expect(balance).toBe(4000n)
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
        expect(balance).toBe(0n)
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
        expect(balance).toBe(5000n)
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
        expect(balance).toBe(0n)
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

      const balance = await polkadotApi.getBalanceForeignBifrost(address, {
        symbol: 'DOT'
      } as sdkCore.TAsset)

      expect(mockApiPromise.query.tokens.accounts).toHaveBeenCalledWith(address, {
        Token: 'DOT'
      })
      expect(balance).toBe(6000n)
    })

    it('should return null when no matching asset found', async () => {
      const address = 'some_address'

      const mockResponse = {
        free: { toString: () => '0' }
      } as unknown as VoidFn

      vi.mocked(mockApiPromise.query.tokens.accounts).mockResolvedValue(mockResponse)

      const balance = await polkadotApi.getBalanceForeignBifrost(address, {
        symbol: 'DOT'
      } as sdkCore.TAsset)

      expect(mockApiPromise.query.tokens.accounts).toHaveBeenCalledWith(address, {
        Token: 'DOT'
      })
      expect(balance).toBe(0n)
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

      const balance = await polkadotApi.getBalanceForeignXTokens('Acala', address, {
        symbol: 'DOT',
        assetId: '1'
      })
      expect(mockApiPromise.query.tokens.accounts.entries).toHaveBeenCalledWith(address)
      expect(balance).toBe(6000n)
    })

    it('should return null when no matching asset found', async () => {
      const address = 'some_address'

      vi.mocked(mockApiPromise.query.tokens.accounts.entries).mockResolvedValue([])

      const balance = await polkadotApi.getBalanceForeignXTokens('Acala', address, {
        symbol: 'DOT',
        assetId: '1'
      })
      expect(mockApiPromise.query.tokens.accounts.entries).toHaveBeenCalledWith(address)
      expect(balance).toBe(0n)
    })

    it('should return null when no matching asset found - Centrifuge', async () => {
      const address = 'some_address'

      vi.mocked(mockApiPromise.query.ormlTokens.accounts.entries).mockResolvedValue([])

      const balance = await polkadotApi.getBalanceForeignXTokens('Centrifuge', address, {
        symbol: 'DOT',
        assetId: '1'
      })
      expect(mockApiPromise.query.ormlTokens.accounts.entries).toHaveBeenCalledWith(address)
      expect(balance).toBe(0n)
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

      const balance = await polkadotApi.getBalanceForeignXTokens('Acala', address, {
        symbol: 'DOT',
        assetId: '1'
      })
      expect(mockApiPromise.query.tokens.accounts.entries).toHaveBeenCalledWith(address)
      expect(balance).toBe(6000n)
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

      const balance = await polkadotApi.getBalanceForeignXTokens('Acala', address, {
        symbol: 'DOT',
        assetId: '1'
      })
      expect(mockApiPromise.query.tokens.accounts.entries).toHaveBeenCalledWith(address)
      expect(balance).toBe(6000n)
    })
  })

  describe('getBalanceForeignMoonbeam', () => {
    it('should return the balance when asset matches assetId', async () => {
      const address = 'some_address'
      const mockResponse = {
        toJSON: () => ({ balance: '7000' })
      } as unknown as VoidFn

      vi.mocked(mockApiPromise.query.assets.account).mockResolvedValue(mockResponse)

      const balance = await polkadotApi.getBalanceForeignAssetsAccount(address, 1n)

      expect(mockApiPromise.query.assets.account).toHaveBeenCalledWith(1n, address)
      expect(balance).toBe(7000n)
    })

    it('should return null when balance does not exist', async () => {
      const address = 'some_address'
      const mockResponse = {
        toJSON: () => ({})
      } as unknown as VoidFn

      vi.mocked(mockApiPromise.query.assets.account).mockResolvedValue(mockResponse)

      const balance = await polkadotApi.getBalanceForeignAssetsAccount(address, 1)

      expect(mockApiPromise.query.assets.account).toHaveBeenCalledWith(1, address)
      expect(balance).toEqual(0n)
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

      const result = await polkadotApi.getFromRpc('state', 'getStorage', key)

      expect(mockApiPromise.rpc.state.getStorage).toHaveBeenCalledWith(key)

      expect(result).toBe('0x1234567890abcdef')
    })
  })

  describe('createApiForNode', () => {
    it('should create a new PolkadotJsApi instance and call init with the provided node', async () => {
      const node = 'Acala'
      const mockCreateApiInstanceForNode = vi
        .spyOn(sdkCore, 'createApiInstanceForNode')
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

    it('should disconnect the api when force is true', async () => {
      const mockDisconnect = vi.spyOn(mockApiPromise, 'disconnect').mockResolvedValue()

      polkadotApi.setApi('api')
      await polkadotApi.disconnect(true)

      expect(mockDisconnect).toHaveBeenCalled()

      mockDisconnect.mockRestore()
    })

    it('should not disconnect the api when force is false and disconnectAllowed is false', async () => {
      const mockDisconnect = vi.spyOn(mockApiPromise, 'disconnect').mockResolvedValue()

      polkadotApi.setApi('api')
      polkadotApi.setDisconnectAllowed(false)
      await polkadotApi.disconnect(false)

      expect(mockDisconnect).not.toHaveBeenCalled()

      mockDisconnect.mockRestore()
    })
  })

  describe('getBalanceNativeAcala', () => {
    it('should return the free balance as bigint', async () => {
      polkadotApi.setApi(mockApiPromise)
      const balance = await polkadotApi.getBalanceNativeAcala('some_address', 'AUSD')

      expect(mockApiPromise.query.tokens.accounts).toHaveBeenCalledOnce()
      expect(balance).toBe(0n)
    })
  })

  describe('getDryRun', () => {
    it('should return sucess when dryRunCall is successful', async () => {
      const mockExtrinsic = {
        paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toBigInt: () => 1000n } })
      } as unknown as Extrinsic

      const address = 'some_address'
      const node = 'Astar'

      const mockResponse = {
        toHuman: vi.fn().mockReturnValue({
          Ok: {
            executionResult: { Ok: true }
          }
        })
      } as unknown as Codec

      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockResolvedValue(mockResponse)

      const result = await polkadotApi.getDryRun({ tx: mockExtrinsic, address, node })

      expect(mockApiPromise.call.dryRunApi.dryRunCall).toHaveBeenCalledWith(
        { system: { Signed: address } },
        mockExtrinsic
      )

      expect(result).toEqual({
        success: true,
        fee: 1000n
      })
    })

    it('should return failureReason when dryRunCall is not successful', async () => {
      const mockExtrinsic = {
        paymentInfo: vi.fn().mockResolvedValue({ partialFee: { toBigInt: () => 1000n } })
      } as unknown as Extrinsic

      const address = 'some_address'
      const node = 'Astar'

      const mockResponse = {
        toHuman: vi.fn().mockReturnValue({
          Ok: {
            executionResult: { Err: { error: { Module: 'ModuleError' } } }
          }
        })
      } as unknown as Codec

      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockResolvedValue(mockResponse)

      const result = await polkadotApi.getDryRun({ tx: mockExtrinsic, address, node })

      expect(mockApiPromise.call.dryRunApi.dryRunCall).toHaveBeenCalledWith(
        { system: { Signed: address } },
        mockExtrinsic
      )

      expect(result).toEqual({
        success: false,
        failureReason: 'ModuleError'
      })
    })
  })

  describe('objectToHex', () => {
    it('should return the object as hex string', async () => {
      const object = { key: 'value' }
      const result = await polkadotApi.objectToHex(object, 'XcmVersionedXcm')
      expect(result).toBe('0x1234567890abcdef')
    })
  })

  describe('hexToUint8a', () => {
    it('should return the hex string as Uint8Array', () => {
      const hex = '0x1234567890abcdef'
      const result = polkadotApi.hexToUint8a(hex)
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })

  describe('stringToUint8a', () => {
    it('should return the string as Uint8Array', () => {
      const str = 'some string'
      const result = polkadotApi.stringToUint8a(str)
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })

  describe('blake2AsHex', () => {
    it('should return the data as hex string', () => {
      const data = new Uint8Array(8)
      const result = polkadotApi.blake2AsHex(data)
      expect(result).toBe('0x81e47a19e6b29b0a65b9591762ce5143ed30d0261e5d24a3201752506b20f15c')
    })
  })
})
