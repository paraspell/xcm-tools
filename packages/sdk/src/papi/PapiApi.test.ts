import { describe, it, expect, beforeEach, vi } from 'vitest'
import PapiApi from './PapiApi'
import type { PolkadotClient } from 'polkadot-api'
import type { TPapiTransaction } from '../papi/types'
import type {
  TNodeWithRelayChains,
  TSerializedApiCallV2,
  TCurrencyCore,
  TMultiLocation
} from '../types'
import * as utils from '../utils'
import { createClient, FixedSizeBinary } from 'polkadot-api'
import type { JsonRpcProvider } from 'polkadot-api/dist/reexports/ws-provider_node'
import { getWsProvider } from 'polkadot-api/ws-provider/node'

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

describe('PapiApi', () => {
  let papiApi: PapiApi
  let mockPolkadotClient: PolkadotClient
  let mockTransaction: TPapiTransaction

  beforeEach(async () => {
    papiApi = new PapiApi()

    mockTransaction = {
      getEstimatedFees: vi.fn().mockResolvedValue(BigInt(1000))
    } as unknown as TPapiTransaction

    mockPolkadotClient = {
      getUnsafeApi: vi.fn().mockReturnValue({
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
                  free: BigInt(2000)
                }
              })
            }
          },
          Assets: {
            Account: {
              getValue: vi.fn().mockResolvedValue({
                balance: BigInt(3000)
              })
            }
          },
          Balances: {
            Account: {
              getValue: vi.fn().mockResolvedValue({
                free: BigInt(4000)
              })
            }
          },
          ForeignAssets: {
            Account: {
              getValue: vi.fn().mockResolvedValue({
                balance: BigInt(5000)
              })
            }
          },
          Tokens: {
            Accounts: {
              getEntries: vi.fn().mockResolvedValue([
                {
                  keyArgs: {
                    toString: vi.fn().mockReturnValue('DOT')
                  },
                  value: {
                    free: {
                      toString: vi.fn().mockReturnValue('6000')
                    }
                  }
                }
              ])
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
      await papiApi.init('SomeNode' as TNodeWithRelayChains)
      expect(papiApi.getApi()).toBe(mockPolkadotClient)
    })

    it('should create api instance when _api is undefined', async () => {
      papiApi.setApi(undefined)
      const mockCreateApiInstanceForNode = vi
        .spyOn(utils, 'createApiInstanceForNode')
        .mockResolvedValue(mockPolkadotClient)

      await papiApi.init('SomeNode' as TNodeWithRelayChains)

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
      const serializedCall: TSerializedApiCallV2 = {
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
      expect(fee).toBe(BigInt(1000))
    })
  })

  describe('getBalanceNative', () => {
    it('should return the free balance as bigint', async () => {
      papiApi.setApi(mockPolkadotClient)
      const balance = await papiApi.getBalanceNative('some_address')

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.System.Account.getValue).toHaveBeenCalledWith('some_address')
      expect(balance).toBe(BigInt(2000))
    })
  })

  describe('getBalanceForeign', () => {
    it('should return the foreign balance as bigint when balance exists', async () => {
      papiApi.setApi(mockPolkadotClient)
      const balance = await papiApi.getBalanceForeign('some_address', 'asset_id')

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.Assets.Account.getValue).toHaveBeenCalledWith(
        'some_address',
        'asset_id'
      )
      expect(balance).toBe(BigInt(3000))
    })

    it('should return null when balance does not exist', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Assets.Account.getValue = vi.fn().mockResolvedValue({})

      const balance = await papiApi.getBalanceForeign('some_address', 'asset_id')

      expect(balance).toBeNull()
    })
  })

  describe('getMythosForeignBalance', () => {
    it('should return the Mythos foreign balance as bigint when balance exists', async () => {
      papiApi.setApi(mockPolkadotClient)
      const balance = await papiApi.getMythosForeignBalance('some_address')

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.Balances.Account.getValue).toHaveBeenCalledWith('some_address')
      expect(balance).toBe(BigInt(4000))
    })

    it('should return null when free balance does not exist', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Balances.Account.getValue = vi.fn().mockResolvedValue({})

      const balance = await papiApi.getMythosForeignBalance('some_address')

      expect(balance).toBeNull()
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
        multiLocation,
        'some_address'
      )
      expect(balance).toBe(BigInt(5000))
    })

    it('should return 0 when balance does not exist', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.ForeignAssets.Account.getValue = vi.fn().mockResolvedValue({})

      const balance = await papiApi.getAssetHubForeignBalance('some_address', multiLocation)

      expect(balance).toBe(BigInt(0))
    })
  })

  describe('getBalanceForeignXTokens', () => {
    it('should return the balance when asset matches symbolOrId', async () => {
      papiApi.setApi(mockPolkadotClient)
      const symbolOrId: TCurrencyCore = { symbol: 'DOT' }
      const balance = await papiApi.getBalanceForeignXTokens('some_address', symbolOrId, 'DOT', '1')

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.Tokens.Accounts.getEntries).toHaveBeenCalledWith('some_address')
      expect(balance).toBe(BigInt(6000))
    })

    it('should return null when no matching asset found', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Tokens.Accounts.getEntries = vi.fn().mockResolvedValue([])

      const symbolOrId: TCurrencyCore = { symbol: 'DOT' }
      const balance = await papiApi.getBalanceForeignXTokens('some_address', symbolOrId, 'DOT', '1')

      expect(balance).toBeNull()
    })
  })

  describe('clone', () => {
    it('should return a new instance of PapiApi', () => {
      const cloneApi = papiApi.clone()
      expect(cloneApi).toBeInstanceOf(PapiApi)
      expect(cloneApi).not.toBe(papiApi)
    })
  })
})
