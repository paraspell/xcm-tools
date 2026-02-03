import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type Zeitgeist from './Zeitgeist'

vi.mock('../../pallets/polkadotXcm')

describe('Zeitgeist', () => {
  let chain: Zeitgeist<unknown, unknown, unknown>

  const mockInput = {
    assetInfo: { symbol: 'ZTG', isNative: true, amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>
  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'Zeitgeist'>('Zeitgeist')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Zeitgeist')
    expect(chain.info).toBe('zeitgeist')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V4)
  })

  it('canReceiveFrom returns false for Astar and true for other chains', () => {
    expect(chain.canReceiveFrom('Astar')).toBe(false)
    expect(chain.canReceiveFrom('Acala')).toBe(true)
  })

  it('should create typeAndThen call when transferPolkadotXcm is invoked', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  describe('transferLocalNonNativeAsset', () => {
    const mockApi = {
      deserializeExtrinsics: vi.fn()
    } as unknown as IPolkadotApi<unknown, unknown, unknown>

    it('should throw an error when asset is not a foreign asset', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', isNative: true, amount: 100n },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      expect(() => chain.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should throw an error when assetId is undefined', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      expect(() => chain.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const spy = vi.spyOn(mockApi, 'deserializeExtrinsics')

      chain.transferLocalNonNativeAsset(mockOptions)

      expect(spy).toHaveBeenCalledWith({
        module: 'AssetManager',
        method: 'transfer',
        params: {
          dest: { Id: mockOptions.address },
          currency_id: { ForeignAsset: 1 },
          amount: BigInt(mockOptions.assetInfo.amount)
        }
      })
    })
  })
})
