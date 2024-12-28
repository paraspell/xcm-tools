import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  TXTokensTransferOptions,
  TPolkadotXCMTransferOptions,
  TSendInternalOptions
} from '../../types'
import { Parents, Version } from '../../types'
import XTokensTransferImpl from '../../pallets/xTokens'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import type { BifrostPolkadot } from './BifrostPolkadot'
import { getNode } from '../../utils'
import { createCurrencySpec } from '../../pallets/xcmPallet/utils'
import { getAssetId } from '../../pallets/assets'
import { ETHEREUM_JUNCTION } from '../../constants'

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

describe('BifrostPolkadot', () => {
  let bifrostPolkadot: BifrostPolkadot<unknown, unknown>
  const mockXTokensInput = {
    asset: { symbol: 'BNC', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  const mockPolkadotXCMInput = {
    asset: { symbol: 'WETH', amount: '100' }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    bifrostPolkadot = getNode<unknown, unknown, 'BifrostPolkadot'>('BifrostPolkadot')
  })

  it('should initialize with correct values', () => {
    expect(bifrostPolkadot.node).toBe('BifrostPolkadot')
    expect(bifrostPolkadot.info).toBe('bifrost')
    expect(bifrostPolkadot.type).toBe('polkadot')
    expect(bifrostPolkadot.version).toBe(Version.V3)
  })

  it('should call transferXTokens with Native when currency matches native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(bifrostPolkadot, 'getNativeAssetSymbol').mockReturnValue('BNC')

    bifrostPolkadot.transferXTokens(mockXTokensInput)

    expect(spy).toHaveBeenCalledWith(mockXTokensInput, { Native: 'BNC' })
  })

  it('should call transferPolkadotXCM with correct parameters for WETH transfer', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await bifrostPolkadot.transferPolkadotXCM(mockPolkadotXCMInput)

    expect(spy).toHaveBeenCalledWith(
      {
        ...mockPolkadotXCMInput,
        currencySelection: createCurrencySpec(
          mockPolkadotXCMInput.asset.amount,
          Version.V3,
          2, // Parents.TWO
          mockPolkadotXCMInput.overriddenAsset,
          {
            X2: [
              ETHEREUM_JUNCTION,
              {
                AccountKey20: { key: getAssetId('Ethereum', 'WETH') ?? '' }
              }
            ]
          }
        )
      },
      'transfer_assets',
      'Unlimited'
    )
  })

  it('should call transferPolkadotXCM with correct parameters for DOT transfer', async () => {
    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    const asset = { symbol: 'DOT', amount: '100' }

    await bifrostPolkadot.transferPolkadotXCM({
      ...mockPolkadotXCMInput,
      asset
    })

    expect(spy).toHaveBeenCalledWith(
      {
        ...mockPolkadotXCMInput,
        asset,
        currencySelection: createCurrencySpec(
          mockPolkadotXCMInput.asset.amount,
          Version.V3,
          Parents.ONE,
          mockPolkadotXCMInput.overriddenAsset
        )
      },
      'transfer_assets',
      'Unlimited'
    )
  })

  describe('canUseXTokens', () => {
    it('should return false when currency symbol is WETH and destination is AssetHubPolkadot', () => {
      const options = {
        asset: { symbol: 'WETH' },
        destination: 'AssetHubPolkadot'
      } as TSendInternalOptions<unknown, unknown>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(false)
    })

    it('should return false when currency symbol is DOT and destination is AssetHubPolkadot', () => {
      const options: TSendInternalOptions<unknown, unknown> = {
        asset: { symbol: 'DOT' },
        destination: 'AssetHubPolkadot'
      } as TSendInternalOptions<unknown, unknown>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(false)
    })

    it('should return true when currency symbol is not WETH or DOT and destination is AssetHubPolkadot', () => {
      const options: TSendInternalOptions<unknown, unknown> = {
        asset: { symbol: 'BNC' },
        destination: 'AssetHubPolkadot'
      } as TSendInternalOptions<unknown, unknown>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(true)
    })

    it('should return true when currency symbol is WETH but destination is not AssetHubPolkadot', () => {
      const options: TSendInternalOptions<unknown, unknown> = {
        asset: { symbol: 'WETH' },
        destination: 'Acala'
      } as TSendInternalOptions<unknown, unknown>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(true)
    })

    it('should return true when currency ymbol is DOT but destination is not AssetHubPolkadot', () => {
      const options: TSendInternalOptions<unknown, unknown> = {
        asset: { symbol: 'DOT' },
        destination: 'Acala'
      } as TSendInternalOptions<unknown, unknown>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(true)
    })
  })
})
