import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { findAssetInfoByLoc, findAssetInfoOrThrow, InvalidCurrencyError } from '@paraspell/assets'
import { hasJunction, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils'
import { getParaId } from '../config'
import type Hydration from './Hydration'

vi.mock('@paraspell/sdk-common', async importActual => ({
  ...(await importActual()),
  hasJunction: vi.fn()
}))

vi.mock('@paraspell/assets', async importActual => ({
  ...(await importActual()),
  findAssetInfoByLoc: vi.fn(),
  findAssetInfoOrThrow: vi.fn()
}))

vi.mock('../../transfer/getBridgeStatus', () => ({
  getBridgeStatus: vi.fn().mockResolvedValue('Normal')
}))

vi.mock('../../pallets/polkadotXcm')
vi.mock('../../utils/transfer')

type WithTransferToEthereum = Hydration<unknown, unknown, unknown> & {
  transferToEthereum: Hydration<unknown, unknown, unknown>['transferToEthereum']
}

describe('Hydration', () => {
  let hydration: Hydration<unknown, unknown, unknown>

  const mockExtrinsic = {} as unknown

  beforeEach(() => {
    vi.clearAllMocks()
    hydration = getChain<unknown, unknown, unknown, 'Hydration'>('Hydration')
    vi.mocked(transferPolkadotXcm).mockResolvedValue(mockExtrinsic)
  })

  it('should initialize with correct values', () => {
    expect(hydration.chain).toBe('Hydration')
    expect(hydration.info).toBe('hydradx')
    expect(hydration.ecosystem).toBe('Polkadot')
    expect(hydration.version).toBe(Version.V4)
  })

  describe('transferPolkadotXCM', () => {
    let mockApi: IPolkadotApi<unknown, unknown, unknown>
    let mockInput: TPolkadotXCMTransferOptions<unknown, unknown, unknown>

    beforeEach(() => {
      mockApi = {
        deserializeExtrinsics: vi.fn().mockReturnValue(mockExtrinsic),
        createApiForChain: vi.fn().mockResolvedValue({
          getFromRpc: vi.fn().mockResolvedValue('0x0000000000000000'),
          disconnect: vi.fn()
        }),
        getFromRpc: vi.fn().mockResolvedValue('0x0000000000000000'),
        accountToHex: vi.fn().mockReturnValue('0x0000000000000000'),
        stringToUint8a: vi.fn().mockReturnValue(new Uint8Array(0)),
        hexToUint8a: vi.fn().mockReturnValue(new Uint8Array(0)),
        blake2AsHex: vi.fn().mockReturnValue('0x0000000000000000'),
        clone: vi.fn()
      } as unknown as IPolkadotApi<unknown, unknown, unknown>

      mockInput = {
        api: mockApi,
        address: '0xPolkadotAddress',
        assetInfo: {
          symbol: 'WETH',
          assetId: '0x1234567890abcdef',
          amount: 1000n,
          location: {
            parents: 2,
            interior: {
              X2: [
                {
                  GlobalConsensus: {
                    Ethereum: {
                      chainId: 1
                    }
                  }
                },
                {
                  AccountKey20: {
                    network: null,
                    key: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
                  }
                }
              ]
            }
          }
        },
        scenario: 'RelayToPara',
        destination: 'Ethereum'
      } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

      vi.mocked(findAssetInfoByLoc).mockReturnValue(undefined)
    })

    it('should call api.deserializeExtrinsics with correct parameters', async () => {
      const spy = vi
        .spyOn(hydration as WithTransferToEthereum, 'transferToEthereum')
        .mockResolvedValue('mocked-result')

      vi.mocked(findAssetInfoByLoc).mockReturnValue({
        assetId: '0x1234567890abcdef',
        symbol: 'WETH',
        decimals: 18,
        location: {
          parents: 2,
          interior: 'Here'
        }
      })

      await hydration.transferPolkadotXCM({
        ...mockInput,
        senderAddress: '5Gw3s7q'
      })

      expect(spy).toHaveBeenCalled()
    })

    it('should call transferMoonbeamWhAsset for Moonbeam Wormhole asset', async () => {
      const mockInput = {
        assetInfo: {
          symbol: 'WORM',
          amount: 500n,
          location: {
            parents: 1,
            interior: {
              X2: [{ Parachain: getParaId('Moonbeam') }, { PalletInstance: 110 }]
            }
          },
          assetId: '999'
        },
        destination: 'Moonbeam',
        version: hydration.version
      } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

      vi.mocked(hasJunction).mockReturnValueOnce(true).mockReturnValueOnce(true)

      const transferMoonbeamWhAssetSpy = vi
        .spyOn(hydration, 'transferMoonbeamWhAsset')
        .mockResolvedValue('moonbeam-wh-result')

      const result = await hydration.transferPolkadotXCM(mockInput)

      expect(transferMoonbeamWhAssetSpy).toHaveBeenCalledWith(mockInput)
      expect(result).toBe('moonbeam-wh-result')
    })

    it('transferMoonbeamWhAsset should call transferPolkadotXcm with overridden fee + asset', async () => {
      const mockAsset = {
        symbol: 'WORM',
        amount: 500n,
        location: {},
        assetId: '123'
      }

      const mockGlmrAsset = {
        symbol: 'GLMR',
        location: { parents: 1, interior: 'Here' }
      } as WithAmount<TAssetInfo>

      vi.mocked(findAssetInfoOrThrow).mockReturnValue(mockGlmrAsset)

      const mockInput = {
        assetInfo: mockAsset
      } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

      await hydration.transferMoonbeamWhAsset(mockInput)

      expect(transferPolkadotXcm).toHaveBeenCalledWith(
        expect.objectContaining({
          overriddenAsset: expect.arrayContaining([expect.anything(), expect.anything()])
        })
      )
    })
  })

  const mockApi = {
    deserializeExtrinsics: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown, unknown>

  describe('transferLocalNativeAsset', () => {
    it('should call api.deserializeExtrinsics with correct parameters', async () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'DOT', amount: 1000n },
        address: '0x1234567890abcdef',
        balance: 2000n,
        keepAlive: false
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      await hydration.transferLocalNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Balances',
        method: 'transfer_allow_death',
        params: {
          dest: mockInput.address,
          value: BigInt(mockInput.assetInfo.amount)
        }
      })
    })

    it('should call transfer_all when amount is ALL', async () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'DOT', amount: 100n },
        address: '0x1234567890abcdef',
        balance: 2000n,
        senderAddress: 'sender',
        isAmountAll: true,
        keepAlive: false
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      await hydration.transferLocalNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Balances',
        method: 'transfer_all',
        params: {
          dest: mockInput.address,
          keep_alive: false
        }
      })
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should throw InvalidCurrencyError if asset is not a foreign asset', () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'DOT', amount: 1000n },
        address: '0x1234567890abcdef'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      expect(() => hydration.transferLocalNonNativeAsset(mockInput)).toThrow(InvalidCurrencyError)
    })

    it('should throw InvalidCurrencyError if assetId is undefined', () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', amount: 1000n },
        address: '0x1234567890abcdef'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      expect(() => hydration.transferLocalNonNativeAsset(mockInput)).toThrow(InvalidCurrencyError)
    })

    it('should call api.deserializeExtrinsics with correct parameters', () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', assetId: '123', amount: 1000n },
        address: '0x1234567890abcdef'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      hydration.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer',
        params: {
          dest: mockInput.address,
          currency_id: 123,
          amount: BigInt(mockInput.assetInfo.amount)
        }
      })
    })

    it('should call transfer_all when amount is ALL', () => {
      const mockInput = {
        api: mockApi,
        assetInfo: { symbol: 'USDC', assetId: '123', amount: 100n },
        address: '0x1234567890abcdef',
        isAmountAll: true,
        keepAlive: false
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      hydration.transferLocalNonNativeAsset(mockInput)

      expect(spy).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer_all',
        params: {
          dest: mockInput.address,
          currency_id: 123,
          keep_alive: false
        }
      })
    })
  })
})
