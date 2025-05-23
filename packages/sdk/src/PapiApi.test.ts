import type { TDryRunXcmBaseOptions } from '@paraspell/sdk-core'
import {
  BatchMode,
  computeFeeFromDryRun,
  type TMultiLocation,
  type TNodeDotKsmWithRelayChains,
  type TSerializedApiCall
} from '@paraspell/sdk-core'
import * as sdkCore from '@paraspell/sdk-core'
import type { Codec, PolkadotClient, SS58String } from 'polkadot-api'
import { AccountId, Binary, createClient, FixedSizeBinary, getSs58AddressInfo } from 'polkadot-api'
import type { JsonRpcProvider } from 'polkadot-api/dist/reexports/ws-provider_node'
import { getWsProvider } from 'polkadot-api/ws-provider/node'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PapiApi from './PapiApi'
import { transform } from './PapiXcmTransformer'
import type { TPapiTransaction } from './types'

vi.mock('polkadot-api/ws-provider/node', () => ({
  getWsProvider: vi.fn().mockReturnValue((_onMessage: (message: string) => void) => ({
    send: vi.fn(),
    disconnect: vi.fn()
  }))
}))

vi.mock('polkadot-api/polkadot-sdk-compat', () => ({
  withPolkadotSdkCompat: vi.fn().mockImplementation((provider: JsonRpcProvider) => provider)
}))

vi.mock('polkadot-api', () => ({
  createClient: vi.fn(),
  FixedSizeBinary: {
    fromAccountId32: vi.fn()
  },
  Binary: {
    fromHex: vi.fn(),
    fromText: vi.fn()
  },
  AccountId: vi.fn(),
  getSs58AddressInfo: vi.fn()
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
          sucesss: true,
          value: {
            actual_weight: {
              ref_time: 0n,
              proof_size: 0n
            }
          }
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
          },
          AssetConversionApi: {
            quote_price_exact_tokens_for_tokens: vi.fn().mockResolvedValue(1n)
          }
        },
        tx: {
          XcmPallet: {
            methodName: vi.fn().mockReturnValue(mockTransaction)
          },
          PolkadotXcm: {
            send: vi.fn().mockReturnValue({
              getEncodedData: vi.fn().mockReturnValue({
                asHex: vi.fn().mockReturnValue('0x1234567890abcdef')
              })
            })
          }
        },
        query: {
          EthereumOutboundQueue: {
            OperatingMode: {
              getValue: vi.fn().mockResolvedValue({ type: 'Normal' })
            }
          },
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

  describe('callBatchMethod', () => {
    it('should call the batch method with the provided calls and BATCH mode', () => {
      const calls = [mockTransaction, mockTransaction]
      const mode = BatchMode.BATCH_ALL

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.tx.Utility = {
        batch: vi.fn(),
        batch_all: vi.fn()
      }

      papiApi.callBatchMethod(calls, mode)

      expect(unsafeApi.tx.Utility.batch).not.toHaveBeenCalled()
      expect(unsafeApi.tx.Utility.batch_all).toHaveBeenCalledOnce()
    })

    it('should call the batch method with the provided calls and BATCH_ALL mode', () => {
      const calls = [mockTransaction, mockTransaction]
      const mode = BatchMode.BATCH

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.tx.Utility = {
        batch: vi.fn(),
        batch_all: vi.fn()
      }

      papiApi.callBatchMethod(calls, mode)

      expect(unsafeApi.tx.Utility.batch).toHaveBeenCalledOnce()
      expect(unsafeApi.tx.Utility.batch_all).not.toHaveBeenCalled()
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
      const balance = await papiApi.getBalanceForeignAssetsPallet('some_address', multiLocation)

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

      const balance = await papiApi.getBalanceForeignAssetsPallet('some_address', multiLocation)

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
      } as sdkCore.TAsset)

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
      const balance = await papiApi.getBalanceAssetsPallet('some_address', 1)

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      expect(unsafeApi.query.Assets.Account.getValue).toHaveBeenCalledWith(1, 'some_address')
      expect(balance).toBe(3000n)
    })

    it('should return 0 when balance does not exist', async () => {
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.query.Assets.Account.getValue = vi.fn().mockResolvedValue(undefined)

      const balance = await papiApi.getBalanceAssetsPallet('some_address', 1)

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

  describe('createApiInstanceForNode', () => {
    it('should create a PolkadotClient instance for the provided node', async () => {
      const apiInstance = await papiApi.createApiForNode('Acala')

      expect(apiInstance).toBeDefined()
    })
  })

  describe('disconnect', () => {
    const spyDestroy = () => vi.spyOn(mockPolkadotClient, 'destroy').mockResolvedValue()

    it('releases (does NOT destroy) when _api is a string and force = false', async () => {
      const destroySpy = spyDestroy()

      papiApi.setApi('ws://example:9944')
      await papiApi.disconnect(false)

      expect(destroySpy).not.toHaveBeenCalled()
    })

    it('releases (does NOT destroy) when _api is undefined and force = false', async () => {
      const providersSpy = vi
        .spyOn(sdkCore, 'getNodeProviders')
        .mockReturnValue(['ws://dummy:9944'])

      const destroySpy = spyDestroy()

      papiApi.setApi(undefined)
      await papiApi.disconnect(false)

      expect(providersSpy).toHaveBeenCalledWith('Acala')
      expect(destroySpy).not.toHaveBeenCalled()

      providersSpy.mockRestore()
    })

    it('destroys when _api is a string and force = true', async () => {
      const destroySpy = spyDestroy()

      papiApi.setApi('ws://example:9944')
      await papiApi.disconnect(true)

      expect(destroySpy).toHaveBeenCalledTimes(1)
    })

    it('does NOT destroy when _api is an injected client and force = false', async () => {
      const destroySpy = spyDestroy()

      papiApi.setApi(mockPolkadotClient)
      await papiApi.disconnect(false)

      expect(destroySpy).not.toHaveBeenCalled()
    })

    it('destroys when _api is an injected client AND force = true', async () => {
      const destroySpy = spyDestroy()

      papiApi.setApi(mockPolkadotClient)
      await papiApi.disconnect(true)

      expect(destroySpy).toHaveBeenCalledTimes(1)
    })

    it('does nothing when disconnectAllowed = false and force = false', async () => {
      const destroySpy = spyDestroy()

      papiApi.setApi('ws://example:9944')
      papiApi.setDisconnectAllowed(false)
      await papiApi.disconnect(false)

      expect(destroySpy).not.toHaveBeenCalled()
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

  describe('accountToHex', () => {
    it('should return the hex representation of the account - prefixed', () => {
      const account = 'some_account'
      const hexAccount = '0x1234567890abcdef'

      const mockFixedSizeBinary = {
        asHex: vi.fn().mockReturnValue('0x1234567890abcdef')
      }
      const spy = vi
        .spyOn(FixedSizeBinary, 'fromAccountId32')
        .mockReturnValue(mockFixedSizeBinary as unknown as FixedSizeBinary<32>)

      const result = papiApi.accountToHex(account)

      expect(spy).toHaveBeenCalledWith(account)
      expect(result).toBe(hexAccount)
    })

    it('should return the account if the output should not start with 0x', () => {
      const account = 'some_account'
      const hexAccount = '1234567890abcdef'

      const spy = vi.spyOn(papiApi, 'accountToHex').mockReturnValue(hexAccount)

      const result = papiApi.accountToHex(account, false)

      expect(spy).toHaveBeenCalledWith(account, false)
      expect(result).toBe('1234567890abcdef')
    })
  })

  describe('accountToUint8a', () => {
    it('returns the public key bytes when the SS58 address is valid', () => {
      const addr = '5FHneW46xGXgs5mUiveU4sbTyGBzmst2oT29E5c9F7NYtiLP'
      const publicKey = new Uint8Array([1, 2, 3, 4])

      vi.mocked(getSs58AddressInfo).mockReturnValue({
        isValid: true,
        publicKey,
        ss58Format: 42
      })

      const res = papiApi.accountToUint8a(addr)

      expect(getSs58AddressInfo).toHaveBeenCalledWith(addr)
      expect(res).toEqual(publicKey)
    })

    it('throws InvalidParameterError when the address is invalid', () => {
      const badAddr = 'invalid_address'

      vi.mocked(getSs58AddressInfo).mockReturnValue({
        isValid: false
      })

      expect(() => papiApi.accountToUint8a(badAddr)).toThrow(sdkCore.InvalidParameterError)
      expect(getSs58AddressInfo).toHaveBeenCalledWith(badAddr)
    })
  })

  describe('getMethodName', () => {
    it('should return the method name from the transaction', () => {
      const methodName = 'methodName'
      const mockTransaction = {
        decodedCall: {
          value: {
            value: 'methodName'
          }
        }
      } as unknown as TPapiTransaction

      const result = papiApi.getMethod(mockTransaction)

      expect(result).toBe(methodName)
    })
  })

  describe('getDryRunCall', () => {
    it('should return success with calculated fee', async () => {
      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            value: {
              actual_weight: {
                ref_time: 0n,
                proof_size: 0n
              }
            },
            success: true
          },
          forwarded_xcms: [
            [
              {
                type: 'V4',
                value: {
                  parents: 0,
                  interior: {
                    type: 'X1',
                    value: {
                      type: 'Parachain',
                      value: 1000
                    }
                  }
                }
              }
            ]
          ]
        }
      }

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_call = vi.fn().mockResolvedValue(mockApiResponse)

      papiApi.setApi(mockPolkadotClient)

      vi.mocked(computeFeeFromDryRun).mockReturnValue(500n)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: 'some_address',
        node: 'AssetHubPolkadot',
        isFeeAsset: false
      })

      expect(unsafeApi.apis.DryRunApi.dry_run_call).toHaveBeenCalledWith(
        {
          type: 'system',
          value: { type: 'Signed', value: 'some_address' }
        },
        undefined,
        3
      )

      expect(result).toEqual({
        success: true,
        fee: 500n,
        weight: {
          refTime: 0n,
          proofSize: 0n
        },
        forwardedXcms: expect.any(Object),
        destParaId: 1000
      })
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

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: 'some_address',
        node: 'Moonbeam',
        isFeeAsset: false
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

    it('should return failure with failure reason - short error', async () => {
      const mockApiResponse = {
        success: false,
        value: {
          type: 'SomeError'
        }
      }

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_call = vi.fn().mockResolvedValue(mockApiResponse)

      papiApi.setApi(mockPolkadotClient)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: 'some_address',
        node: 'Moonbeam',
        isFeeAsset: false
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

    it('should return failure with failure reason - unknown error', async () => {
      const mockApiResponse = {
        success: false,
        value: {}
      }

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_call = vi.fn().mockResolvedValue(mockApiResponse)

      papiApi.setApi(mockPolkadotClient)

      const result = await papiApi.getDryRunCall({
        tx: mockTransaction,
        address: 'some_address',
        node: 'Moonbeam',
        isFeeAsset: false
      })

      expect(unsafeApi.apis.DryRunApi.dry_run_call).toHaveBeenCalledWith(
        {
          type: 'system',
          value: { type: 'Signed', value: 'some_address' }
        },
        undefined
      )

      expect(result).toEqual({ success: false, failureReason: '{}' })
    })

    it('should throw error for unsupported node', async () => {
      await expect(
        papiApi.getDryRunCall({
          tx: mockTransaction,
          address: 'some_address',
          node: 'Acala',
          isFeeAsset: false
        })
      ).rejects.toThrow(sdkCore.NodeNotSupportedError)
    })
  })

  describe('getDryRunXcm', () => {
    const originLocation: sdkCore.TMultiLocation = {
      parents: 0,
      interior: { Here: null }
    }
    const dummyXcm = { some: 'xcm-payload' }

    it('should return success with destination fee, weight and forwarded XCM', async () => {
      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            type: 'Complete',
            value: {
              used: { ref_time: 11n, proof_size: 22n }
            }
          },
          emitted_events: [
            {
              type: 'Balances',
              value: {
                type: 'Issued',
                value: { amount: 999n }
              }
            }
          ],
          forwarded_xcms: [
            [
              {
                type: 'V4',
                value: {
                  parents: 0,
                  interior: {
                    type: 'X1',
                    value: {
                      type: 'Parachain',
                      value: 1000
                    }
                  }
                }
              }
            ]
          ]
        }
      }

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)

      const result = await papiApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        node: 'AssetHubPolkadot',
        origin: 'Hydration',
        asset: { symbol: 'AUSD' }
      } as TDryRunXcmBaseOptions)

      expect(unsafeApi.apis.DryRunApi.dry_run_xcm).toHaveBeenCalledWith(
        transform(originLocation),
        dummyXcm
      )
      expect(result).toEqual({
        success: true,
        fee: 999n,
        weight: { refTime: 11n, proofSize: 22n },
        forwardedXcms: expect.any(Object),
        destParaId: 1000
      })
    })

    it('should return failure with failure reason', async () => {
      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            type: 'Incomplete',
            value: {
              error: { type: 'SomeXcmError' }
            }
          }
        }
      }

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)

      const result = await papiApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        node: 'AssetHubPolkadot',
        origin: 'Hydration'
      } as TDryRunXcmBaseOptions)

      expect(result).toEqual({ success: false, failureReason: 'SomeXcmError' })
    })

    it('should throw error for unsupported node', async () => {
      await expect(
        papiApi.getDryRunXcm({
          originLocation,
          xcm: dummyXcm,
          node: 'Acala',
          origin: 'Hydration'
        } as TDryRunXcmBaseOptions)
      ).rejects.toThrow(sdkCore.NodeNotSupportedError)
    })

    it('should calculate fee using (amount - originFee - eventAmount) if isFeeAsset and ForeignAssets.Issued event is found', async () => {
      const mockAssetDetails = { symbol: 'USDT', assetId: 'test-asset-id' }
      const testAmount = 10000n
      const testOriginFee = 100n
      const foreignAssetsIssuedAmount = 500n

      const baseOptions: TDryRunXcmBaseOptions = {
        originLocation: { parents: 0, interior: { Here: null } } as sdkCore.TMultiLocation,
        xcm: { some: 'xcm-payload' },
        node: 'AssetHubPolkadot',
        origin: 'AssetHubPolkadot',
        asset: mockAssetDetails,
        feeAsset: mockAssetDetails,
        amount: testAmount,
        originFee: testOriginFee
      }

      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            type: 'Complete',
            value: { used: { ref_time: 10n, proof_size: 20n } }
          },
          emitted_events: [
            {
              type: 'ForeignAssets',
              value: {
                type: 'Issued',
                value: {
                  amount: foreignAssetsIssuedAmount,
                  owner: 'someOwner',
                  asset_id: 'someAssetId'
                }
              }
            },
            {
              type: 'Balances',
              value: {
                type: 'Issued',
                value: { amount: 9999n }
              }
            }
          ],
          forwarded_xcms: []
        }
      }

      const originalIsAssetEqual = sdkCore.isAssetEqual
      vi.spyOn(sdkCore, 'isAssetEqual').mockImplementation((a1, a2) => {
        if (a1 === mockAssetDetails && a2 === mockAssetDetails) {
          return true
        }
        return originalIsAssetEqual(a1, a2)
      })

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)

      const result = await papiApi.getDryRunXcm(baseOptions)

      const expectedFee = testAmount - testOriginFee - foreignAssetsIssuedAmount

      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.fee).toBe(expectedFee)
        expect(result.weight).toEqual({ refTime: 10n, proofSize: 20n })
      }
      expect(sdkCore.isAssetEqual).toHaveBeenCalledWith(baseOptions.feeAsset, baseOptions.asset)
      expect(unsafeApi.apis.DryRunApi.dry_run_xcm).toHaveBeenCalled()

      vi.mocked(sdkCore.isAssetEqual).mockRestore?.()
      vi.mocked(sdkCore.getAssetsObject).mockRestore?.()
    })
  })

  describe('getDryRunXcm', () => {
    const originLocation: sdkCore.TMultiLocation = {
      parents: 0,
      interior: { Here: null }
    }
    const dummyXcm = { some: 'xcm-payload' }

    it('should return success with destination fee, weight and forwarded XCM', async () => {
      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            type: 'Complete',
            value: {
              used: { ref_time: 11n, proof_size: 22n }
            }
          },
          emitted_events: [
            {
              type: 'Balances',
              value: {
                type: 'Issued',
                value: { amount: 999n }
              }
            }
          ],
          forwarded_xcms: []
        }
      }

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)

      const result = await papiApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        node: 'AssetHubPolkadot',
        origin: 'Acala',
        asset: { symbol: 'AUSD' }
      } as TDryRunXcmBaseOptions)

      expect(unsafeApi.apis.DryRunApi.dry_run_xcm).toHaveBeenCalledWith(
        transform(originLocation),
        dummyXcm
      )
      expect(result).toEqual({
        success: true,
        fee: 999n,
        weight: { refTime: 11n, proofSize: 22n },
        forwardedXcms: []
      })
    })

    it('should return failure with failure reason', async () => {
      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            type: 'Incomplete',
            value: {
              error: { type: 'SomeXcmError' }
            }
          }
        }
      }

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)

      const result = await papiApi.getDryRunXcm({
        originLocation,
        xcm: dummyXcm,
        node: 'AssetHubPolkadot',
        origin: 'Acala'
      } as TDryRunXcmBaseOptions)

      expect(result).toEqual({ success: false, failureReason: 'SomeXcmError' })
    })

    it('should throw error for unsupported node', async () => {
      await expect(
        papiApi.getDryRunXcm({
          originLocation,
          xcm: dummyXcm,
          node: 'Acala',
          origin: 'Acala'
        } as TDryRunXcmBaseOptions)
      ).rejects.toThrow(sdkCore.NodeNotSupportedError)
    })

    it('should throw error if no issued event found', async () => {
      const mockApiResponse = {
        success: true,
        value: {
          execution_result: {
            type: 'Complete',
            value: {
              used: { ref_time: 11n, proof_size: 22n }
            }
          },
          emitted_events: [],
          forwarded_xcms: ['0xdeadbeef']
        }
      }

      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.DryRunApi.dry_run_xcm = vi.fn().mockResolvedValue(mockApiResponse)

      expect(
        await papiApi.getDryRunXcm({
          originLocation,
          xcm: dummyXcm,
          node: 'AssetHubPolkadot',
          origin: 'Mythos'
        } as TDryRunXcmBaseOptions)
      ).toEqual({
        success: false,
        failureReason: 'Cannot determine destination fee. No Issued event found'
      })
    })
  })

  describe('objectToHex', () => {
    it('should return the hex representation of the object', async () => {
      const object = { key1: 'value1', key2: 'value2' }

      const result = await papiApi.objectToHex(object)

      expect(result).toBe('0xabcdef')
    })
  })

  describe('hexToUint8a', () => {
    it('should return the Uint8Array representation of the hex', () => {
      const hex = '0x1234567890abcdef'
      const uint8a = new Uint8Array([18, 52, 86, 120, 144, 171, 205, 239])

      const mockBinary = {
        asBytes: vi.fn().mockReturnValue(uint8a)
      }
      const spy = vi
        .spyOn(Binary, 'fromHex')
        .mockReturnValue(mockBinary as unknown as FixedSizeBinary<32>)

      const result = papiApi.hexToUint8a(hex)

      expect(result).toEqual(uint8a)

      expect(spy).toHaveBeenCalledWith(hex)
    })
  })

  describe('stringToUint8a', () => {
    it('should return the Uint8Array representation of the string', () => {
      const string = 'some_string'
      const uint8a = new Uint8Array([115, 111, 109, 101, 95, 115, 116, 114, 105, 110, 103])

      const mockBinary = {
        asBytes: vi.fn().mockReturnValue(uint8a)
      }
      const spy = vi
        .spyOn(Binary, 'fromText')
        .mockReturnValue(mockBinary as unknown as FixedSizeBinary<32>)

      const result = papiApi.stringToUint8a(string)

      expect(spy).toHaveBeenCalledWith(string)

      expect(result).toEqual(uint8a)
    })
  })

  describe('blake2AsHex', () => {
    it('should return the hex representation of the blake2 hash', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
      const hex = '0x1234567890abcdef'

      const spy = vi.spyOn(papiApi, 'blake2AsHex').mockReturnValue(hex)

      const result = papiApi.blake2AsHex(data)

      expect(result).toBe(hex)

      expect(spy).toHaveBeenCalledWith(data)
    })
  })

  describe('getFromRpc', () => {
    it('should call _request with correct parameters for non-system module', async () => {
      const module = 'foo'
      const method = 'bar'
      const key = 'nonHexKey'
      const rpcMethod = `${module}_${method}`
      const returnedValue = 123

      vi.mocked(AccountId).mockReturnValue({
        dec: vi.fn().mockReturnValue(key)
      } as unknown as Codec<SS58String>)
      const spy = vi.spyOn(mockPolkadotClient, '_request').mockResolvedValue(returnedValue)

      const result = await papiApi.getFromRpc(module, method, key)

      expect(spy).toHaveBeenCalledWith(rpcMethod, [key])
      expect(result).toBe('0x0000007b')
    })

    it('should call _request with converted key for system module when key is hex', async () => {
      const module = 'system'
      const method = 'doSomething'
      const hexKey = '0xabcdef'
      const fakeDec = vi.fn().mockReturnValue(`ss58(${hexKey})`)
      vi.mocked(AccountId).mockReturnValue({ dec: fakeDec } as unknown as Codec<SS58String>)

      const rpcMethod = `${module}_${method}`
      const returnedValue = '0xdeadbeef'
      const spy = vi.spyOn(mockPolkadotClient, '_request').mockResolvedValue(returnedValue)

      const result = await papiApi.getFromRpc(module, method, hexKey)

      expect(fakeDec).toHaveBeenCalledWith(hexKey)
      expect(spy).toHaveBeenCalledWith(rpcMethod, [`ss58(${hexKey})`])
      expect(result).toBe(returnedValue)
    })
  })

  describe('quoteAhPrices', () => {
    it('should return the quote for the provided asset', async () => {
      const mlFrom = {
        parents: 1,
        interior: {
          X1: {
            Parachain: 1000
          }
        }
      }
      const mlTo = {
        parents: 1,
        interior: {
          X1: {
            Parachain: 1001
          }
        }
      }

      const amountIn = 1000n
      const quote = await papiApi.quoteAhPrice(mlFrom, mlTo, amountIn)

      expect(quote).toBe(1n)
    })

    it('should return undefined when quote is not available', async () => {
      const mlFrom = {
        parents: 1,
        interior: {
          X1: {
            Parachain: 1000
          }
        }
      }
      const mlTo = {
        parents: 1,
        interior: {
          X1: {
            Parachain: 1001
          }
        }
      }

      const amountIn = 1000n
      const unsafeApi = papiApi.getApi().getUnsafeApi()
      unsafeApi.apis.AssetConversionApi.quote_price_exact_tokens_for_tokens = vi
        .fn()
        .mockResolvedValue(undefined)

      const quote = await papiApi.quoteAhPrice(mlFrom, mlTo, amountIn)

      expect(quote).toBeUndefined()
    })
  })

  describe('getBridgeStatus', () => {
    it('should return the bridge status', async () => {
      const status = await papiApi.getBridgeStatus()
      expect(status).toEqual('Normal')
    })
  })

  describe('PapiApi - timed cache integration', () => {
    it('re-uses the same PolkadotClient and destroys it after refs drop to 0 when destroyWanted=true', async () => {
      vi.useFakeTimers()

      const ws = 'ws://cache-test:9944'
      const sharedClient = {
        destroy: vi.fn(),
        getUnsafeApi: vi.fn().mockReturnValue({}),
        getChainSpecData: vi.fn().mockResolvedValue(undefined)
      } as unknown as PolkadotClient

      // first lease will create the client; subsequent ones should not
      vi.mocked(createClient).mockReturnValue(sharedClient)

      const apiA = new PapiApi()
      apiA.setApi(ws)
      await apiA.init('Acala', 1_000) // ttl = 1 s

      const apiB = new PapiApi()
      apiB.setApi(ws)
      await apiB.init('Acala', 1_000)

      expect(createClient).toHaveBeenCalledTimes(1) // same underlying connection

      // ⏩ first expiry while still in use => mark destroyWanted but keep alive
      vi.advanceTimersByTime(1_001)
      expect(sharedClient.destroy).not.toHaveBeenCalled()

      // release one reference – still 1 left
      await apiA.disconnect()
      expect(sharedClient.destroy).not.toHaveBeenCalled()

      // release last reference – destroyWanted && refs==0 -> real destroy
      await apiB.disconnect()
      expect(sharedClient.destroy).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })

    it('evicts and destroys an idle client after its TTL elapses', async () => {
      vi.useFakeTimers()

      const ws = 'ws://cache-test2:9944'
      const idleClient = {
        destroy: vi.fn(),
        getUnsafeApi: vi.fn().mockReturnValue({}),
        getChainSpecData: vi.fn().mockResolvedValue(undefined)
      } as unknown as PolkadotClient
      vi.mocked(createClient).mockReturnValue(idleClient)

      const api = new PapiApi()
      api.setApi(ws)
      await api.init('Acala', 500) // ttl = 0.5 s

      // drop the only reference – entry.refs becomes 0
      await api.disconnect()
      expect(idleClient.destroy).not.toHaveBeenCalled()

      // ⏩ timer fires, entry is evicted because refs==0
      vi.advanceTimersByTime(501)
      expect(idleClient.destroy).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })
  })
})
