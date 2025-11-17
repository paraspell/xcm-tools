import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AMOUNT_ALL } from '../../constants'
import { ChainNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferXTokens } from '../../pallets/xTokens'
import type {
  TSendInternalOptions,
  TTransferLocalOptions,
  TXTokensTransferOptions
} from '../../types'
import { getChain } from '../../utils/getChain'
import type Peaq from './Peaq'

vi.mock('../../pallets/xTokens')

describe('Peaq', () => {
  let chain: Peaq<unknown, unknown>
  const mockInput = {
    asset: { assetId: '123', amount: 100n },
    scenario: 'ParaToPara'
  } as TXTokensTransferOptions<unknown, unknown>

  const sendOptions = {} as unknown as TSendInternalOptions<unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, 'Peaq'>('Peaq')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Peaq')
    expect(chain.info).toBe('peaq')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V4)
  })

  it('should call transferXTokens with valid scenario', () => {
    chain.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, 123n)
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as TXTokensTransferOptions<
      unknown,
      unknown
    >

    expect(() => chain.transferXTokens(invalidInput)).toThrowError(ScenarioNotSupportedError)
  })

  it('should throw ChainNotSupportedError for transferRelayToPara', () => {
    expect(() => chain.transferRelayToPara()).toThrowError(ChainNotSupportedError)
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should throw an error when asset is not a foreign asset', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      expect(() => chain.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should throw an error when assetId is undefined', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      expect(() => chain.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      chain.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer',
        params: {
          target: { Id: mockOptions.address },
          id: 1n,
          amount: BigInt(mockOptions.assetInfo.amount)
        }
      })
    })

    it('should call transfer_all when amount is ALL', () => {
      const mockApi = {
        deserializeExtrinsics: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: AMOUNT_ALL, assetId: '1' },
        address: 'address',
        isAmountAll: true
      } as unknown as TTransferLocalOptions<unknown, unknown>

      chain.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer_all',
        params: {
          dest: { Id: mockOptions.address },
          id: 1n,
          keep_alive: false
        }
      })
    })
  })

  it('isSendingTempDisabled should return true', () => {
    expect(chain.isSendingTempDisabled(sendOptions)).toBe(true)
  })

  it('isReceivingTempDisabled should return true', () => {
    expect(chain.isReceivingTempDisabled('ParaToPara')).toBe(true)
  })
})
