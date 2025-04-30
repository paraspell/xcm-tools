import { InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NodeNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import XTokensTransferImpl from '../../pallets/xTokens'
import type {
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TTransferLocalOptions,
  TXTokensTransferOptions
} from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type { Ajuna } from './Ajuna'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

vi.mock('../../pallets/polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

vi.mock('@paraspell/assets', async () => {
  const actual = await vi.importActual('@paraspell/assets')
  return {
    ...actual,
    isForeignAsset: vi.fn()
  }
})

describe('Ajuna', () => {
  let ajuna: Ajuna<unknown, unknown>

  const baseXTokensInput = {
    scenario: 'ParaToPara',
    asset: { symbol: 'BNC', amount: '100' }
  } as unknown as TXTokensTransferOptions<unknown, unknown>

  const basePolkadotXCMInput = {
    scenario: 'ParaToRelay',
    asset: { symbol: 'DOT', amount: '100' }
  } as unknown as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    ajuna = getNode<unknown, unknown, 'Ajuna'>('Ajuna')
    vi.clearAllMocks()
  })

  it('exposes the correct static metadata', () => {
    expect(ajuna.node).toBe('Ajuna')
    expect(ajuna.info).toBe('ajuna')
    expect(ajuna.type).toBe('polkadot')
    expect(ajuna.version).toBe(Version.V4)
  })

  describe('transferXTokens', () => {
    it('delegates to XTokens implementation when called with native asset', () => {
      const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
      vi.spyOn(ajuna, 'getNativeAssetSymbol').mockReturnValue('BNC')

      ajuna.transferXTokens(baseXTokensInput)

      expect(spy).toHaveBeenCalledWith(baseXTokensInput, 'BNC')
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
        asset: { symbol: 'DOT', amount: '100' }
      } as TXTokensTransferOptions<unknown, unknown>
      expect(() => ajuna.transferXTokens(badInput)).toThrow(InvalidCurrencyError)
    })
  })

  describe('transferPolkadotXCM', () => {
    it('delegates unchanged input to PolkadotXCM implementation', async () => {
      const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
      await ajuna.transferPolkadotXCM(basePolkadotXCMInput)
      expect(spy).toHaveBeenCalledWith(basePolkadotXCMInput, 'transfer_assets', 'Unlimited')
    })
  })

  describe('canUseXTokens', () => {
    it('returns false only for DOT → AssetHubPolkadot', () => {
      const options = {
        asset: { symbol: 'DOT' },
        to: 'AssetHubPolkadot'
      } as unknown as TSendInternalOptions<unknown, unknown>
      expect(ajuna['canUseXTokens'](options)).toBe(false)
    })

    it('returns true for every other pair', () => {
      const cases: Array<[string, string]> = [
        ['BNC', 'AssetHubPolkadot'],
        ['DOT', 'Acala'],
        ['WETH', 'AssetHubPolkadot']
      ]
      cases.forEach(([symbol, to]) => {
        const res = ajuna['canUseXTokens']({
          asset: { symbol },
          to
        } as unknown as TSendInternalOptions<unknown, unknown>)
        expect(res).toBe(true)
      })
    })
  })

  describe('transferRelayToPara', () => {
    it('always throws NodeNotSupportedError', () => {
      expect(() => ajuna.transferRelayToPara()).toThrow(NodeNotSupportedError)
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    const mockApi = {
      callTxMethod: vi.fn()
    }

    it('calls Assets.transfer when provided with a valid foreign asset', () => {
      vi.mocked(isForeignAsset).mockReturnValue(true)

      const opts = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100', assetId: '1' },
        address: 'addr'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      ajuna.transferLocalNonNativeAsset(opts)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith({
        module: 'Assets',
        section: 'transfer',
        parameters: {
          id: 1,
          target: { Id: 'addr' },
          amount: BigInt('100')
        }
      })
    })

    it('throws InvalidCurrencyError when asset is not foreign', () => {
      vi.mocked(isForeignAsset).mockReturnValue(false)
      const opts = {
        api: mockApi,
        asset: { symbol: 'BNC', amount: '100' },
        address: 'addr'
      } as unknown as TTransferLocalOptions<unknown, unknown>
      expect(() => ajuna.transferLocalNonNativeAsset(opts)).toThrow(InvalidCurrencyError)
    })

    it('throws InvalidCurrencyError when foreign asset has no assetId', () => {
      vi.mocked(isForeignAsset).mockReturnValue(true)
      const opts = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100' },
        address: 'addr'
      } as unknown as TTransferLocalOptions<unknown, unknown>
      expect(() => ajuna.transferLocalNonNativeAsset(opts)).toThrow(InvalidCurrencyError)
    })
  })
})
