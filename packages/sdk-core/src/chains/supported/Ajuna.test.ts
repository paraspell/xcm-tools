import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AMOUNT_ALL } from '../../constants'
import { ChainNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions, TXTokensTransferOptions } from '../../types'
import { getChain } from '../../utils'
import type Ajuna from './Ajuna'

vi.mock('../../pallets/xTokens')
vi.mock('../../transfer')

describe('Ajuna', () => {
  let ajuna: Ajuna<unknown, unknown>

  const baseXTokensInput = {
    scenario: 'ParaToPara',
    asset: { symbol: 'BNC', amount: '100' }
  } as unknown as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    ajuna = getChain<unknown, unknown, 'Ajuna'>('Ajuna')
    vi.clearAllMocks()
  })

  it('exposes the correct static metadata', () => {
    expect(ajuna.chain).toBe('Ajuna')
    expect(ajuna.info).toBe('ajuna')
    expect(ajuna.ecosystem).toBe('Polkadot')
    expect(ajuna.version).toBe(Version.V4)
  })

  describe('transferXTokens', () => {
    it('delegates to XTokens implementation when called with native asset', () => {
      vi.spyOn(ajuna, 'getNativeAssetSymbol').mockReturnValue('BNC')

      ajuna.transferXTokens(baseXTokensInput)

      expect(transferXTokens).toHaveBeenCalledWith(baseXTokensInput, 'BNC')
    })

    it('throws ScenarioNotSupportedError for scenarios other than ParaToPara', () => {
      const badInput = {
        ...baseXTokensInput,
        scenario: 'ParaToRelay'
      } as TXTokensTransferOptions<unknown, unknown>
      expect(() => ajuna.transferXTokens(badInput)).toThrow(ScenarioNotSupportedError)
    })

    it('throws InvalidCurrencyError if asset is not native', () => {
      vi.spyOn(ajuna, 'getNativeAssetSymbol').mockReturnValue('BNC')
      const badInput = {
        ...baseXTokensInput,
        asset: { symbol: 'DOT', amount: 100n }
      } as TXTokensTransferOptions<unknown, unknown>
      expect(() => ajuna.transferXTokens(badInput)).toThrow(InvalidCurrencyError)
    })
  })

  describe('transferRelayToPara', () => {
    it('always throws ChainNotSupportedError', () => {
      expect(() => ajuna.transferRelayToPara()).toThrow(ChainNotSupportedError)
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    const mockApi = {
      deserializeExtrinsics: vi.fn()
    }

    it('creates local transfer', () => {
      const opts = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'addr'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      ajuna.transferLocalNonNativeAsset(opts)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer',
        params: {
          id: 1,
          target: { Id: 'addr' },
          amount: 100n
        }
      })
    })

    it('calls transfer_all when amount is ALL', () => {
      const opts = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: AMOUNT_ALL, assetId: '1' },
        address: 'addr',
        isAmountAll: true
      } as unknown as TTransferLocalOptions<unknown, unknown>

      ajuna.transferLocalNonNativeAsset(opts)

      expect(mockApi.deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer_all',
        params: {
          id: 1,
          dest: { Id: 'addr' },
          keep_alive: false
        }
      })
    })
  })
})
