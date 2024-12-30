import { describe, it, expect, beforeEach, vi } from 'vitest'
import PapiApi from './PapiApi'
import type { PolkadotClient } from 'polkadot-api'
import { createClient, FixedSizeBinary } from 'polkadot-api'
import type { JsonRpcProvider } from 'polkadot-api/dist/reexports/ws-provider_node'
import { getWsProvider } from 'polkadot-api/ws-provider/node'
import { transform } from './PapiXcmTransformer'
import type { TPapiTransaction } from './types'
import {
  computeFeeFromDryRun,
  type TMultiLocation,
  type TNodeDotKsmWithRelayChains,
  type TSerializedApiCall
} from '@paraspell/sdk-core'
import * as sdkCore from '@paraspell/sdk-core'

vi.mock('polkadot-api/ws-provider/node', () => ({
  getWsProvider: vi.fn().mockReturnValue((_onMessage: (message: string) => void) => ({
    send: vi.fn(),
    disconnect: vi.fn()
  }))
}))

vi.mock('polkadot-api', () => ({
  createClient: vi.fn(),
  withPolkadotSdkCompat: vi.fn().mockImplementation((provider: JsonRpcProvider) => provider),
  FixedSizeBinary: {
    fromAccountId32: vi.fn()
  }
}))

vi.mock('./PapiXcmTransformer', () => ({
  transform: vi.fn().mockReturnValue({ transformed: true })
}))

vi.mock('../utils/dryRun/computeFeeFromDryRun', () => ({
  computeFeeFromDryRun: vi.fn()
}))

vi.mock('../utils/createApiInstanceForNode', () => ({
  createApiInstanceForNode: vi.fn().mockResolvedValue({} as PolkadotClient)
}))

vi.mock('@paraspell/sdk-core', async importOriginal => {
  return {
    ...(await importOriginal<typeof import('@paraspell/sdk-core')>()),
    computeFeeFromDryRun: vi.fn(),
    createApiInstanceForNode: vi.fn().mockResolvedValue({} as PolkadotClient)
  }
})

describe('PapiApi', () => {
  let papiApi: PapiApi
  let mockPolkadotClient: PolkadotClient
  let mockTransaction: TPapiTransaction
  let mockDryRunResult

  beforeEach(async () => {
    papiApi = new PapiApi()

    mockTransaction = {
      getEstimatedFees: vi.fn().mockResolvedValue(1000n)
    } as unknown as TPapiTransaction

    mockDryRunResult = {
      success: true,
      value: {
        execution_result: {
          sucesss: true
        }
      }
    }

    mockPolkadotClient = {
      _request: vi.fn(),
      destroy: vi.fn(),
      getUnsafeApi: vi.fn().mockReturnValue({
        apis: {
          DryRunApi: {
            dry_run_call: vi.fn().mockResolvedValue(mockDryRunResult)
          }
        },
        tx: {
          XcmPallet: {
            methodName: vi.fn().mockReturnValue(mockTransaction)
          }
        },
        query: {
          System: {
            Account: {
              getValue: vi.fn().mockResolvedValue({
                data: {
                  free: 2000n
                }
              })
            }
          },
          Assets: {
            Account: {
              getValue: vi.fn().mockResolvedValue({
                balance: 3000n
              })
            }
          },
          Balances: {
            Account: {
              getValue: vi.fn().mockResolvedValue({
                free: 4000n
              })
            }
          },
          ForeignAssets: {
            Account: {
              getValue: vi.fn().mockResolvedValue({
                balance: 5000n
              })
            }
          },
          Tokens: {
            Accounts: {
              getValue: vi.fn().mockResolvedValue({
                free: 6000n
              }),
              getEntries: vi.fn().mockResolvedValue([
                {
                  keyArgs: [
                    '',
                    {
                      toString: vi.fn().mockReturnValue('DOT')
                    }
                  ],
                  value: {
                    free: {
                      toString: vi.fn().mockReturnValue('6000')
                    }
                  }
                }
              ])
            }
          },
          OrmlTokens: {
            Accounts: {
              getEntries: vi.fn().mockResolvedValue([])
            }
          }
        }
      })
    } as unknown as PolkadotClient
    vi.mocked(createClient).mockReturnValue(mockPolkadotClient)
    papiApi.setApi(mockPolkadotClient)
    await papiApi.init('Acala')
  })

  describe('setApi and getApi', () => {
    it('should set and get the api', () => {
      papiApi.setApi(mockPolkadotClient)
      const api = papiApi.getApi()
      expect(api).toBe(mockPolkadotClient)
    })
  })

  describe('init', () => {
    it('should set api to _api when _api is defined', async () => {
      papiApi.setApi(mockPolkadotClient)
      await papiApi.init('SomeNode' as TNodeDotKsmWithRelayChains)
      expect(papiApi.getApi()).toBe(mockPolkadotClient)
    })

    it('should create api instance when _api is undefined', async () => {
      const papiApi = new PapiApi()
      papiApi.setApi(undefined)
      const mockCreateApiInstanceForNode = vi
        .spyOn(sdkCore, 'createApiInstanceForNode')
        .mockResolvedValue(mockPolkadotClient)

      await papiApi.init('SomeNode' as TNodeDotKsmWithRelayChains)

      expect(mockCreateApiInstanceForNode).toHaveBeenCalledWith(papiApi, 'SomeNode')
      expect(papiApi.getApi()).toBe(mockPolkadotClient)

      mockCreateApiInstanceForNode.mockRestore()
    })
  })

  describe('createApiInstance', () => {
    it('should create a PolkadotClient instance', async () => {
      const wsUrl = 'ws://localhost:9944'

      const apiInstance = await papiApi.createApiInstance(wsUrl)

      expect(apiInstance).toBe(mockPolkadotClient)
      expect(getWsProvider).toHaveBeenCalledWith(wsUrl)
      expect(createClient).toHaveBeenCalledOnce()
      vi.resetAllMocks()
    })
  })

  describe('createAccountId', () => {
    it('should return a hex string representation of the AccountId', () => {
      const address = 'some_address'
      const mockFixedSizeBinary = {
        asHex: vi.fn().mockReturnValue('0x1234567890abcdef')
      }
      const spy = vi
        .spyOn(FixedSizeBinary, 'fromAccountId32')
        .mockReturnValue(mockFixedSizeBinary as unknown as FixedSizeBinary<32>)

      const result = papiApi.createAccountId(address)

      expect(spy).toHaveBeenCalledWith(address)
      expect(mockFixedSizeBinary.asHex).toHaveBeenCalled()
      expect(result).toBe('0x1234567890abcdef')
    })
  })

  describe('callTxMethod', () => {
    it('should create a transaction with the provided module, section, and parameters', () => {
      const serializedCall: TSerializedApiCall = {
        module: 'XcmPallet',
        section: 'methodName',
        parameters: { param1: 'value1', param2: 'value2' }
      }

      const mockTxMethod = vi.fn().mockReturnValue(mockTransaction)
      const unsafeApi = papiApi.getApi().getUnsafeApi()

      unsafeApi.tx = {
        XcmPallet: {
          methodName: mockTxMethod
        }
      }

      const result = papiApi.callTxMethod(serializedCall)

      expect(result).toBe(mockTransaction)
      expect(mockTxMethod).toHaveBeenCalledOnce()
    })
  })

  describe('calculateTransactionFee', () => {
    it('should return the estimated fee as bigint', async () => {
      const fee = await papiApi.calculateTransactionFee(mockTransaction, 'some_address')
      expect(mockTransaction.getEstimatedFees).toHaveBeenCalledWith('some_address')
      expect(fee).toBe(1000n)
    })
  })

  describe('getBalanceNative', () => {
    it('should return the free balance as bigint', async () => {
      papiApi.setApi(mockPolkadotClient)
      const balance = await papiApi.getBalanceNative('some_address')

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.System.Account.getValue).toHaveBeenCalledWith('some_address')
      expect(balance).toBe(2000n)
    })
  })

  describe('getBalanceForeign', () => {
    it('should return the foreign balance as bigint when balance exists', async () => {
      papiApi.setApi(mockPolkadotClient)
      const balance = await papiApi.getBalanceForeignPolkadotXcm('some_address', 'asset_id')

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.Assets.Account.getValue).toHaveBeenCalledWith(
        'asset_id',
        'some_address'
      )
      expect(balance).toBe(3000n)
    })

    it('should return null when balance does not exist', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Assets.Account.getValue = vi.fn().mockResolvedValue({})

      const balance = await papiApi.getBalanceForeignPolkadotXcm('some_address', 'asset_id')

      expect(balance).toBe(0n)
    })
  })

  describe('getMythosForeignBalance', () => {
    it('should return the Mythos foreign balance as bigint when balance exists', async () => {
      papiApi.setApi(mockPolkadotClient)
      const balance = await papiApi.getMythosForeignBalance('some_address')

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.Balances.Account.getValue).toHaveBeenCalledWith('some_address')
      expect(balance).toBe(4000n)
    })

    it('should return null when free balance does not exist', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Balances.Account.getValue = vi.fn().mockResolvedValue({})

      const balance = await papiApi.getMythosForeignBalance('some_address')

      expect(balance).toEqual(0n)
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
      papiApi.setApi(mockPolkadotClient)
      const balance = await papiApi.getAssetHubForeignBalance('some_address', multiLocation)

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.ForeignAssets.Account.getValue).toHaveBeenCalledWith(
        transform(multiLocation),
        'some_address'
      )
      expect(balance).toBe(5000n)
    })

    it('should return 0 when balance does not exist', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.ForeignAssets.Account.getValue = vi.fn().mockResolvedValue(undefined)

      const balance = await papiApi.getAssetHubForeignBalance('some_address', multiLocation)

      expect(balance).toBe(0n)
    })
  })

  describe('getBalanceForeignBifrost', () => {
    it('should return the balance when balance exists', async () => {
      const transformedCurrencySelection = { type: 'Native', value: 'BNC' }

      vi.mocked(transform).mockReturnValue(transformedCurrencySelection)

      papiApi.setApi(mockPolkadotClient)
      const balance = await papiApi.getBalanceForeignBifrost('some_address', {
        symbol: 'BNC'
      })

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.Tokens.Accounts.getValue).toHaveBeenCalledWith(
        'some_address',
        transformedCurrencySelection
      )
      expect(balance).toBe(6000n)
    })
  })

  describe('getBalanceForeignXTokens', () => {
    it('should return the balance when asset matches symbolOrId', async () => {
      papiApi.setApi(mockPolkadotClient)

      const balance = await papiApi.getBalanceForeignXTokens('Acala', 'some_address', {
        symbol: 'DOT',
        assetId: '1'
      })

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.Tokens.Accounts.getEntries).toHaveBeenCalledWith('some_address')
      expect(balance).toBe(6000n)
    })

    it('should return the balance when asset matches object by id', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Tokens.Accounts.getEntries = vi.fn().mockResolvedValue([
        {
          keyArgs: [
            '',
            {
              toString: vi.fn().mockReturnValue(''),
              type: 'ForeignToken',
              value: '1'
            }
          ],
          value: {
            free: {
              toString: vi.fn().mockReturnValue('6000')
            }
          }
        }
      ])

      const balance = await papiApi.getBalanceForeignXTokens('Acala', 'some_address', {
        symbol: 'DOT',
        assetId: '1'
      })

      expect(balance).toBe(6000n)
    })

    it('should return the balance when asset matches object by symbol', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Tokens.Accounts.getEntries = vi.fn().mockResolvedValue([
        {
          keyArgs: [
            '',
            {
              toString: vi.fn().mockReturnValue(''),
              type: 'ForeignToken',
              value: 'DOT'
            }
          ],
          value: {
            free: {
              toString: vi.fn().mockReturnValue('6000')
            }
          }
        }
      ])

      const balance = await papiApi.getBalanceForeignXTokens('Acala', 'some_address', {
        symbol: 'DOT',
        assetId: '1'
      })

      expect(balance).toBe(6000n)
    })

    it('should return null when no matching asset found', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Tokens.Accounts.getEntries = vi.fn().mockResolvedValue([])

      const balance = await papiApi.getBalanceForeignXTokens('Acala', 'some_address', {
        symbol: 'DOT',
        assetId: '1'
      })

      expect(balance).toEqual(0n)
    })

    it('should return null when no matching asset found - Centrifuge', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.OrmlTokens.Accounts.getEntries = vi.fn().mockResolvedValue([])

      const balance = await papiApi.getBalanceForeignXTokens('Centrifuge', 'some_address', {
        symbol: 'DOT',
        assetId: '1'
      })

      expect(balance).toEqual(0n)
    })
  })

  describe('getBalanceForeignMoonbeam', () => {
    it('should return the balance when balance exists', async () => {
      papiApi.setApi(mockPolkadotClient)
      const balance = await papiApi.getBalanceForeignAssetsAccount('some_address', 1)

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.Assets.Account.getValue).toHaveBeenCalledWith(1, 'some_address')
      expect(balance).toBe(3000n)
    })

    it('should return 0 when balance does not exist', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Assets.Account.getValue = vi.fn().mockResolvedValue(undefined)

      const balance = await papiApi.getBalanceForeignAssetsAccount('some_address', 1)

      expect(balance).toEqual(0n)
    })
  })

  describe('clone', () => {
    it('should return a new instance of PapiApi', () => {
      const cloneApi = papiApi.clone()
      expect(cloneApi).toBeInstanceOf(PapiApi)
      expect(cloneApi).not.toBe(papiApi)
    })
  })

  describe('getFromStorage', () => {
    it('should return the value from storage', async () => {
      const key = 'some_key'
      const value = 'some_value'

      const spy = vi.spyOn(papiApi.getApi(), '_request').mockResolvedValue(value)

      const result = await papiApi.getFromStorage(key)

      expect(spy).toHaveBeenCalledWith('state_getStorage', [key])
      expect(result).toBe(value)
    })
  })

  describe('createApiInstanceForNode', () => {
    it('should create a PolkadotClient instance for the provided node', async () => {
      const apiInstance = await papiApi.createApiForNode('Acala')

      expect(apiInstance).toBeDefined()
    })
  })

  describe('disconnect', () => {
    it('should disconnect the api when _api is a string', async () => {
      const mockDisconnect = vi.spyOn(mockPolkadotClient, 'destroy').mockResolvedValue()

      papiApi.setApi('api')
      await papiApi.disconnect()

      expect(mockDisconnect).toHaveBeenCalled()

      mockDisconnect.mockRestore()
    })

    it('should disconnect the api when _api is not provided', async () => {
      const mockDisconnect = vi.spyOn(mockPolkadotClient, 'destroy').mockResolvedValue()

      papiApi.setApi(undefined)
      await papiApi.disconnect()

      expect(mockDisconnect).toHaveBeenCalled()

      mockDisconnect.mockRestore()
    })

    it('should not disconnect the api when _api is provided', async () => {
      const mockDisconnect = vi.spyOn(mockPolkadotClient, 'destroy').mockResolvedValue()

      papiApi.setApi(mockPolkadotClient)
      await papiApi.disconnect()

      expect(mockDisconnect).not.toHaveBeenCalled()

      mockDisconnect.mockRestore()
    })
  })

  describe('getBalanceNativeAcala', () => {
    it('should return the free balance as bigint', async () => {
      papiApi.setApi(mockPolkadotClient)
      const balance = await papiApi.getBalanceNativeAcala('some_address', 'AUSD')

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.Tokens.Accounts.getValue).toHaveBeenCalledOnce()
      expect(balance).toBe(6000n)
    })
  })

  describe('getDryRun', () => {
    it('should return success with calculated fee', async () => {
      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            success: true
          }
        }
      }

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_call = vi.fn().mockResolvedValue(mockApiResponse)

      papiApi.setApi(mockPolkadotClient)

      vi.mocked(computeFeeFromDryRun).mockReturnValue(500n)

      const result = await papiApi.getDryRun({
        tx: mockTransaction,
        address: 'some_address',
        node: 'AssetHubPolkadot'
      })

      expect(unsafeApi.apis.DryRunApi.dry_run_call).toHaveBeenCalledWith(
        {
          type: 'system',
          value: { type: 'Signed', value: 'some_address' }
        },
        undefined
      )

      expect(result).toEqual({ success: true, fee: 500n })
    })

    it('should return failure with failure reason', async () => {
      const mockApiResponse = {
        success: false,
        value: {
          execution_result: {
            value: {
              error: {
                value: {
                  value: {
                    type: 'SomeError'
                  }
                }
              }
            }
          }
        }
      }

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_call = vi.fn().mockResolvedValue(mockApiResponse)

      papiApi.setApi(mockPolkadotClient)

      const result = await papiApi.getDryRun({
        tx: mockTransaction,
        address: 'some_address',
        node: 'Moonbeam'
      })

      expect(unsafeApi.apis.DryRunApi.dry_run_call).toHaveBeenCalledWith(
        {
          type: 'system',
          value: { type: 'Signed', value: 'some_address' }
        },
        undefined
      )

      expect(result).toEqual({ success: false, failureReason: 'SomeError' })
    })
  })
})
