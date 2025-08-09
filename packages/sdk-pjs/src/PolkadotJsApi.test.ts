import type { TAsset, TDryRunXcmBaseOptions } from '@paraspell/sdk-core'
import {
  BatchMode,
  computeFeeFromDryRunPjs,
  createApiInstanceForNode,
  MissingChainApiError,
  NodeNotSupportedError,
  type TMultiLocation,
  type TSerializedApiCall
} from '@paraspell/sdk-core'
import { ApiPromise } from '@polkadot/api'
import type { VoidFn } from '@polkadot/api/types'
import type { StorageKey } from '@polkadot/types'
import { u32 } from '@polkadot/types'
import type { AnyTuple, Codec } from '@polkadot/types/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PolkadotJsApi from './PolkadotJsApi'
import type { Extrinsic, TPjsApi } from './types'

vi.mock('@paraspell/sdk-core', async importOriginal => ({
  ...(await importOriginal()),
  computeFeeFromDryRunPjs: vi.fn().mockReturnValue(1000n),
  createApiInstanceForNode: vi.fn().mockResolvedValue({} as ApiPromise),
  resolveModuleError: vi.fn().mockReturnValue('ModuleError')
}))

vi.mock('@polkadot/api', () => ({
  ApiPromise: {
    create: vi.fn()
  },
  WsProvider: vi.fn()
}))

describe('PolkadotJsApi', () => {
  let polkadotApi: PolkadotJsApi
  let mockApiPromise: TPjsApi
  const mockChain = 'Acala'

  beforeEach(async () => {
    mockApiPromise = {
      createType: vi.fn().mockReturnValue({
        toHex: vi.fn().mockReturnValue('0x1234567890abcdef')
      }),
      registry: {},
      call: {
        dryRunApi: {
          dryRunCall: vi.fn(),
          dryRunXcm: vi.fn()
        },
        xcmPaymentApi: {
          queryXcmWeight: vi.fn(),
          queryWeightToAssetFee: vi.fn()
        },
        assetConversionApi: {
          quotePriceExactTokensForTokens: vi.fn().mockResolvedValue({
            toJSON: vi.fn().mockResolvedValue(1n),
            toString: vi.fn().mockReturnValue('1')
          })
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
        ethereumOutboundQueue: {
          operatingMode: vi.fn().mockResolvedValue({ toPrimitive: () => 'Normal' })
        },
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
    vi.spyOn(ApiPromise, 'create').mockResolvedValue(mockApiPromise)
    polkadotApi = new PolkadotJsApi(mockApiPromise)
    await polkadotApi.init(mockChain)
  })

  it('should set and get the api', async () => {
    const newApi = {} as TPjsApi
    const polkadotApi = new PolkadotJsApi(newApi)
    expect(polkadotApi.getConfig()).toBe(newApi)
    await polkadotApi.init('Acala')
    const api = polkadotApi.getApi()
    expect(api).toStrictEqual(newApi)
  })

  describe('init', () => {
    it('should set api to _api when _api is defined', async () => {
      const mockApi = {} as TPjsApi
      const polkadotApi = new PolkadotJsApi(mockApi)
      await polkadotApi.init('Acala')
      expect(polkadotApi.getApi()).toStrictEqual(mockApi)
    })

    it('should create api instance when _api is undefined', async () => {
      const polkadotApi = new PolkadotJsApi()
      const mockCreateApiInstanceForNode = vi
        .mocked(createApiInstanceForNode)
        .mockResolvedValue(mockApiPromise)

      await polkadotApi.init('Acala')

      expect(mockCreateApiInstanceForNode).toHaveBeenCalledWith(polkadotApi, 'Acala')
      expect(polkadotApi.getApi()).toBe(mockApiPromise)

      mockCreateApiInstanceForNode.mockRestore()
    })

    it('should return early if already initialized', async () => {
      vi.mocked(createApiInstanceForNode)

      await polkadotApi.init('Moonbeam')

      expect(createApiInstanceForNode).not.toHaveBeenCalled()
      expect(polkadotApi.getApi()).toBe(mockApiPromise)
    })

    it('should use apiOverrides when provided in config', async () => {
      const polkadotApi = new PolkadotJsApi({
        apiOverrides: {
          Moonbeam: mockApiPromise
        }
      })
      await polkadotApi.init('Moonbeam')

      expect(polkadotApi.getApi()).toBe(mockApiPromise)
      expect(vi.mocked(createApiInstanceForNode)).not.toHaveBeenCalled()
    })

    it('should throw MissingChainApiError in development mode when no override provided', async () => {
      polkadotApi = new PolkadotJsApi({
        development: true,
        apiOverrides: {
          Acala: mockApiPromise
          // Moonbeam not provided
        }
      })

      await expect(polkadotApi.init('Moonbeam')).rejects.toThrow(
        new MissingChainApiError('Moonbeam')
      )
    })

    it('should create api automatically when no config and no overrides', async () => {
      const polkadotApi = new PolkadotJsApi()
      vi.mocked(createApiInstanceForNode).mockResolvedValue(mockApiPromise)

      await polkadotApi.init('Acala')

      expect(createApiInstanceForNode).toHaveBeenCalledWith(polkadotApi, 'Acala')
      expect(polkadotApi.getApi()).toBe(mockApiPromise)
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

  describe('accountToUint8a', () => {
    it('should return the hex address as Uint8Array', () => {
      const address = '0x1234567890abcdef'
      const result = polkadotApi.accountToUint8a(address)
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })

  describe('getMethod', () => {
    it('should return the method', () => {
      const tx = {
        method: ''
      } as unknown as Extrinsic
      const result = polkadotApi.getMethod(tx)
      expect(result).toBe(tx.method)
    })
  })

  describe('callTxMethod', () => {
    it('should create an extrinsic with the provided module, method, and parameters', () => {
      const serializedCall: TSerializedApiCall = {
        module: 'XTokens',
        method: 'transfer',
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

        const balance = await polkadotApi.getBalanceForeignAssetsPallet(address, multiLocation)

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

        const balance = await polkadotApi.getBalanceForeignAssetsPallet(address, multiLocation)

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
      } as TAsset)

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
      } as TAsset)

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

      const balance = await polkadotApi.getBalanceAssetsPallet(address, 1n)

      expect(mockApiPromise.query.assets.account).toHaveBeenCalledWith(1n, address)
      expect(balance).toBe(7000n)
    })

    it('should return null when balance does not exist', async () => {
      const address = 'some_address'
      const mockResponse = {
        toJSON: () => ({})
      } as unknown as VoidFn

      vi.mocked(mockApiPromise.query.assets.account).mockResolvedValue(mockResponse)

      const balance = await polkadotApi.getBalanceAssetsPallet(address, 1)

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

  describe('getXcmPaymentApiFee', () => {
    it('should return the XCM payment fee for AssetHub nodes', async () => {
      const xcm = { some: 'xcm_payload' }
      const asset: TAsset = {
        symbol: 'DOT',
        multiLocation: {
          parents: 1,
          interior: {
            X1: {
              Parachain: 1000
            }
          }
        }
      }

      const mockWeight = {
        refTime: '1000',
        proofSize: '2000'
      }

      const mockFeeResult = {
        toString: vi.fn().mockReturnValue('5000')
      }

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).mockResolvedValue(mockWeight)
      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).mockResolvedValue(
        mockFeeResult
      )

      const fee = await polkadotApi.getXcmPaymentApiFee('AssetHubPolkadot', xcm, asset)

      expect(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).toHaveBeenCalledWith(xcm)
      expect(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).toHaveBeenCalledWith(
        mockWeight,
        expect.objectContaining({
          V4: expect.any(Object)
        })
      )
      expect(fee).toBe(5000n)
    })

    it('should return the XCM payment fee for regular nodes', async () => {
      const xcm = { some: 'xcm_payload' }
      const asset: TAsset = {
        symbol: 'KSM',
        multiLocation: {
          parents: 0,
          interior: {
            Here: null
          }
        }
      }

      const mockWeight = {
        refTime: '2000',
        proofSize: '3000'
      }

      const mockFeeResult = {
        toString: vi.fn().mockReturnValue('10000')
      }

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).mockResolvedValue(mockWeight)
      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).mockResolvedValue(
        mockFeeResult
      )

      const fee = await polkadotApi.getXcmPaymentApiFee('Acala', xcm, asset)

      expect(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).toHaveBeenCalledWith(xcm)
      expect(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).toHaveBeenCalledWith(
        mockWeight,
        expect.objectContaining({
          V4: asset.multiLocation
        })
      )
      expect(fee).toBe(10000n)
    })

    it('should throw error when asset has no multiLocation', async () => {
      const xcm = { some: 'xcm_payload' }
      const asset = {
        symbol: 'DOT'
        // No multiLocation
      } as TAsset

      await expect(
        polkadotApi.getXcmPaymentApiFee('AssetHubPolkadot', xcm, asset)
      ).rejects.toThrow()
    })

    it('should handle relay chain nodes', async () => {
      const xcm = { some: 'xcm_payload' }
      const asset: TAsset = {
        symbol: 'DOT',
        multiLocation: {
          parents: 0,
          interior: {
            X1: {
              Parachain: 2000
            }
          }
        }
      }

      const mockWeight = {
        refTime: '1500',
        proofSize: '2500'
      }

      const mockFeeResult = {
        toString: vi.fn().mockReturnValue('7500')
      }

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).mockResolvedValue(mockWeight)
      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).mockResolvedValue(
        mockFeeResult
      )

      const fee = await polkadotApi.getXcmPaymentApiFee('Polkadot', xcm, asset)

      expect(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).toHaveBeenCalledWith(xcm)
      expect(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).toHaveBeenCalledWith(
        mockWeight,
        expect.objectContaining({
          V4: expect.any(Object)
        })
      )
      expect(fee).toBe(7500n)
    })

    it('should handle AssetHubKusama node', async () => {
      const xcm = { some: 'xcm_payload' }
      const asset: TAsset = {
        symbol: 'KSM',
        multiLocation: {
          parents: 1,
          interior: {
            X1: {
              Parachain: 1000
            }
          }
        }
      }

      const mockWeight = {
        refTime: '3000',
        proofSize: '4000'
      }

      const mockFeeResult = {
        toString: vi.fn().mockReturnValue('15000')
      }

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).mockResolvedValue(mockWeight)
      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).mockResolvedValue(
        mockFeeResult
      )

      const fee = await polkadotApi.getXcmPaymentApiFee('AssetHubKusama', xcm, asset)

      expect(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).toHaveBeenCalledWith(xcm)
      expect(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).toHaveBeenCalledWith(
        mockWeight,
        expect.objectContaining({
          V4: expect.any(Object)
        })
      )
      expect(fee).toBe(15000n)
    })

    it('should handle Kusama relay chain', async () => {
      const xcm = { some: 'xcm_payload' }
      const asset: TAsset = {
        symbol: 'KSM',
        multiLocation: {
          parents: 0,
          interior: {
            Here: null
          }
        }
      }

      const mockWeight = {
        refTime: '2500',
        proofSize: '3500'
      }

      const mockFeeResult = {
        toString: vi.fn().mockReturnValue('12500')
      }

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).mockResolvedValue(mockWeight)
      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).mockResolvedValue(
        mockFeeResult
      )

      const fee = await polkadotApi.getXcmPaymentApiFee('Kusama', xcm, asset)

      expect(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).toHaveBeenCalledWith(xcm)
      expect(mockApiPromise.call.xcmPaymentApi.queryWeightToAssetFee).toHaveBeenCalledWith(
        mockWeight,
        expect.objectContaining({
          V4: expect.any(Object)
        })
      )
      expect(fee).toBe(12500n)
    })
  })

  describe('createApiForNode', () => {
    it('should create a new PolkadotJsApi instance and call init with the provided node', async () => {
      const node = 'Acala'
      const mockCreateApiInstanceForNode = vi
        .mocked(createApiInstanceForNode)
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

      polkadotApi = new PolkadotJsApi('api')
      await polkadotApi.init(mockChain)
      await polkadotApi.disconnect()

      expect(mockDisconnect).toHaveBeenCalled()

      mockDisconnect.mockRestore()
    })

    it('should disconnect the api when _api is not provided', async () => {
      vi.mocked(createApiInstanceForNode).mockResolvedValue(mockApiPromise)

      const mockDisconnect = vi.spyOn(mockApiPromise, 'disconnect')

      polkadotApi = new PolkadotJsApi()
      await polkadotApi.init(mockChain)
      await polkadotApi.disconnect()

      expect(mockDisconnect).toHaveBeenCalled()

      mockDisconnect.mockRestore()
    })

    it('should not disconnect the api when _api is provided', async () => {
      const mockDisconnect = vi.spyOn(mockApiPromise, 'disconnect').mockResolvedValue()

      polkadotApi = new PolkadotJsApi(mockApiPromise)
      await polkadotApi.disconnect()

      expect(mockDisconnect).not.toHaveBeenCalled()

      mockDisconnect.mockRestore()
    })

    it('should disconnect the api when force is true', async () => {
      const mockDisconnect = vi.spyOn(mockApiPromise, 'disconnect').mockResolvedValue()

      polkadotApi = new PolkadotJsApi('api')
      await polkadotApi.init(mockChain)
      await polkadotApi.disconnect(true)

      expect(mockDisconnect).toHaveBeenCalled()

      mockDisconnect.mockRestore()
    })

    it('should not disconnect the api when force is false and disconnectAllowed is false', async () => {
      const mockDisconnect = vi.spyOn(mockApiPromise, 'disconnect').mockResolvedValue()

      polkadotApi = new PolkadotJsApi('api')
      polkadotApi.setDisconnectAllowed(false)
      await polkadotApi.disconnect(false)

      expect(mockDisconnect).not.toHaveBeenCalled()

      mockDisconnect.mockRestore()
    })
  })

  describe('getBalanceNativeAcala', () => {
    it('should return the free balance as bigint', async () => {
      polkadotApi = new PolkadotJsApi(mockApiPromise)
      await polkadotApi.init(mockChain)

      const balance = await polkadotApi.getBalanceNativeAcala('some_address', 'AUSD')

      expect(mockApiPromise.query.tokens.accounts).toHaveBeenCalledOnce()
      expect(balance).toBe(0n)
    })
  })

  describe('getDryRunCall', () => {
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
        }),
        toJSON: vi.fn().mockReturnValue({
          ok: {
            executionResult: { ok: { actualWeight: { refTime: '1000', proofSize: '2000' } } },
            forwardedXcms: [
              [
                {
                  v4: {
                    parents: 0,
                    interior: { Here: null }
                  }
                }
              ]
            ]
          }
        })
      } as unknown as Codec

      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockResolvedValue(mockResponse)

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        node
      })

      expect(mockApiPromise.call.dryRunApi.dryRunCall).toHaveBeenCalledWith(
        { system: { Signed: address } },
        mockExtrinsic,
        3
      )

      expect(result).toEqual({
        success: true,
        fee: 1000n,
        weight: {
          refTime: 1000n,
          proofSize: 2000n
        },
        forwardedXcms: expect.any(Object)
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
        }),
        toJSON: vi.fn().mockReturnValue({
          ok: {
            executionResult: {
              err: { error: { Module: 'ModuleError' } }
            },
            forwardedXcms: []
          }
        })
      } as unknown as Codec

      vi.mocked(mockApiPromise.call.dryRunApi.dryRunCall).mockResolvedValue(mockResponse)

      const result = await polkadotApi.getDryRunCall({
        tx: mockExtrinsic,
        address,
        node
      })

      expect(mockApiPromise.call.dryRunApi.dryRunCall).toHaveBeenCalledWith(
        { system: { Signed: address } },
        mockExtrinsic,
        3
      )

      expect(result).toEqual({
        success: false,
        failureReason: 'ModuleError'
      })
    })

    it('should throw error for unsupported node', async () => {
      const mockTransaction = {} as unknown as Extrinsic

      await expect(
        polkadotApi.getDryRunCall({
          tx: mockTransaction,
          address: 'some_address',
          node: 'Acala'
        })
      ).rejects.toThrow(NodeNotSupportedError)
    })
  })

  describe('getXcmWeight', () => {
    it('should return the weight from the XCM payload', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const xcm: any = []
      const mockResponse = {
        toJSON: () => ({
          ok: { refTime: '1000', proofSize: '2000' }
        })
      } as unknown as Codec

      vi.mocked(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).mockResolvedValue(mockResponse)

      const result = await polkadotApi.getXcmWeight(xcm)

      expect(mockApiPromise.call.xcmPaymentApi.queryXcmWeight).toHaveBeenCalledWith(xcm)
      expect(result).toEqual({ refTime: '1000', proofSize: '2000' })
    })
  })

  describe('getDryRunXcm', () => {
    const originLocation: TMultiLocation = {
      parents: 0,
      interior: { Here: null }
    }
    const dummyXcm = { some: 'payload' }

    it('should return success with computed fee and weight', async () => {
      const mockResponse = {
        toHuman: vi.fn().mockReturnValue({
          Ok: {
            executionResult: { Complete: {} },
            emittedEvents: [
              {
                method: 'Issued',
                section: 'balances',
                data: {
                  amount: '1000'
                }
              }
            ]
          }
        }),
        toJSON: vi.fn().mockReturnValue({
          ok: {
            executionResult: {
              used: { refTime: '111', proofSize: '222' }
            },
            forwardedXcms: [
              [
                {
                  v4: {
                    parents: 0,
                    interior: { Here: null }
                  }
                }
              ]
            ]
          }
        })
      } as unknown as Codec

      vi.mocked(mockApiPromise.call.dryRunApi.dryRunXcm).mockResolvedValue(mockResponse)

      vi.mocked(computeFeeFromDryRunPjs).mockReturnValue(555n)

      const result = await polkadotApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        node: 'Astar',
        origin: 'Hydration'
      } as TDryRunXcmBaseOptions)

      expect(mockApiPromise.call.dryRunApi.dryRunXcm).toHaveBeenCalledWith(originLocation, dummyXcm)
      expect(result).toEqual({
        success: true,
        fee: 1000n,
        weight: {
          refTime: 111n,
          proofSize: 222n
        },
        forwardedXcms: expect.any(Object)
      })
    })

    it('should return failureReason when dryRunCall is not successful', async () => {
      const mockResponse = {
        toHuman: vi.fn().mockReturnValue({
          Ok: {
            executionResult: { Incomplete: { error: 'ModuleError' } }
          }
        }),
        toJSON: vi.fn().mockReturnValue({
          ok: {
            executionResult: {
              err: { error: { Module: 'ModuleError' } }
            }
          }
        })
      } as unknown as Codec

      vi.mocked(mockApiPromise.call.dryRunApi.dryRunXcm).mockResolvedValue(mockResponse)

      const result = await polkadotApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        node: 'Astar',
        origin: 'Hydration'
      } as TDryRunXcmBaseOptions)

      expect(result).toEqual({
        success: false,
        failureReason: 'ModuleError'
      })
    })

    it('should throw NodeNotSupportedError for unsupported node', async () => {
      await expect(
        polkadotApi.getDryRunXcm({
          originLocation,
          xcm: dummyXcm,
          node: 'Acala',
          origin: 'Hydration'
        } as TDryRunXcmBaseOptions)
      ).rejects.toThrow(NodeNotSupportedError)
    })

    it('should throw error if no issued event found', async () => {
      const mockResponse = {
        toHuman: vi.fn().mockReturnValue({
          Ok: {
            executionResult: { Complete: {} },
            emittedEvents: []
          }
        }),
        toJSON: vi.fn().mockReturnValue({
          ok: {
            executionResult: {
              used: { refTime: '111', proofSize: '222' }
            }
          }
        })
      } as unknown as Codec

      vi.mocked(mockApiPromise.call.dryRunApi.dryRunXcm).mockResolvedValue(mockResponse)

      expect(
        await polkadotApi.getDryRunXcm({
          originLocation,
          xcm: dummyXcm,
          node: 'AssetHubPolkadot',
          origin: 'Hydration'
        } as TDryRunXcmBaseOptions)
      ).toEqual({
        success: false,
        failureReason: 'Cannot determine destination fee. No Issued event found'
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

  describe('quoteAhPrice', () => {
    it('should return the price as bigint', async () => {
      const fromMl = {
        parents: 1,
        interior: {
          X1: {
            Parachain: 1000
          }
        }
      }

      const toMl = {
        parents: 1,
        interior: {
          X1: {
            Parachain: 2000
          }
        }
      }

      const amountIn = 1000n

      const price = await polkadotApi.quoteAhPrice(fromMl, toMl, amountIn)

      expect(
        mockApiPromise.call.assetConversionApi.quotePriceExactTokensForTokens
      ).toHaveBeenCalledWith(fromMl, toMl, '1000', true)
      expect(price).toBe(1n)
    })

    it('should return undefined when quoted is null', async () => {
      const fromMl = {
        parents: 1,
        interior: {
          X1: {
            Parachain: 1000
          }
        }
      }

      const toMl = {
        parents: 1,
        interior: {
          X1: {
            Parachain: 2000
          }
        }
      }

      const amountIn = 1000n

      vi.mocked(
        mockApiPromise.call.assetConversionApi.quotePriceExactTokensForTokens
      ).mockResolvedValue({
        toJSON: vi.fn().mockReturnValue(null)
      })

      const price = await polkadotApi.quoteAhPrice(fromMl, toMl, amountIn)

      expect(
        mockApiPromise.call.assetConversionApi.quotePriceExactTokensForTokens
      ).toHaveBeenCalledWith(fromMl, toMl, '1000', true)
      expect(price).toBeUndefined()
    })
  })

  describe('getBridgeStatus', () => {
    it('should return the bridge status', async () => {
      const status = await polkadotApi.getBridgeStatus()
      expect(status).toEqual('Normal')
    })
  })
})
