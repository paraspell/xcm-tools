import { InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DOT_MULTILOCATION } from '../../constants'
import { NodeNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferXTokens } from '../../pallets/xTokens'
import { createTypeAndThenCall } from '../../transfer'
import type {
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TTransferLocalOptions,
  TXTokensTransferOptions
} from '../../types'
import { getNode } from '../../utils'
import type Ajuna from './Ajuna'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))

vi.mock('../../transfer', () => ({
  createTypeAndThenCall: vi.fn()
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

  const api = {
    callTxMethod: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const basePolkadotXCMInput = {
    api,
    scenario: 'ParaToRelay',
    senderAddress: 'senderAddress',
    asset: { symbol: 'DOT', amount: '100', multiLocation: DOT_MULTILOCATION }
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

  describe('transferPolkadotXCM', () => {
    it('delegates unchanged input to PolkadotXCM implementation', async () => {
      await ajuna.transferPolkadotXCM(basePolkadotXCMInput)
      expect(createTypeAndThenCall).toHaveBeenCalledTimes(1)
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
        asset: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'addr'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      ajuna.transferLocalNonNativeAsset(opts)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer',
        parameters: {
          id: 1,
          target: { Id: 'addr' },
          amount: 100n
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
