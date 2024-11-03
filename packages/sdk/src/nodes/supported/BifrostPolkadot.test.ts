import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  XTokensTransferInput,
  PolkadotXCMTransferInput,
  TSendInternalOptions
} from '../../types'
import { Parents, Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import type { BifrostPolkadot } from './BifrostPolkadot'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'
import { createCurrencySpec } from '../../pallets/xcmPallet/utils'
import { getAssetId } from '../../pallets/assets'
import { ETHEREUM_JUNCTION } from '../../const'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

vi.mock('../polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

describe('BifrostPolkadot', () => {
  let bifrostPolkadot: BifrostPolkadot<ApiPromise, Extrinsic>
  const mockXTokensInput = {
    currency: 'BNC',
    amount: '100'
  } as XTokensTransferInput<ApiPromise, Extrinsic>

  const mockPolkadotXCMInput = {
    amount: '200',
    currencySymbol: 'WETH'
  } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

  beforeEach(() => {
    bifrostPolkadot = getNode<ApiPromise, Extrinsic, 'BifrostPolkadot'>('BifrostPolkadot')
  })

  it('should initialize with correct values', () => {
    expect(bifrostPolkadot.node).toBe('BifrostPolkadot')
    expect(bifrostPolkadot.name).toBe('bifrost')
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
          mockPolkadotXCMInput.amount,
          Version.V3,
          2, // Parents.TWO
          mockPolkadotXCMInput.overridedCurrency,
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

    await bifrostPolkadot.transferPolkadotXCM({ ...mockPolkadotXCMInput, currencySymbol: 'DOT' })

    expect(spy).toHaveBeenCalledWith(
      {
        ...mockPolkadotXCMInput,
        currencySymbol: 'DOT',
        currencySelection: createCurrencySpec(
          mockPolkadotXCMInput.amount,
          Version.V3,
          Parents.ONE,
          mockPolkadotXCMInput.overridedCurrency
        )
      },
      'transfer_assets',
      'Unlimited'
    )
  })

  it('should throw error when currency symbol is undefined in transferXTokens', () => {
    expect(() =>
      bifrostPolkadot.transferXTokens({ ...mockXTokensInput, currency: undefined })
    ).toThrowError('Currency symbol is undefined')
  })

  describe('canUseXTokens', () => {
    it('should return false when currencySymbol is WETH and destination is AssetHubPolkadot', () => {
      const options = {
        currencySymbol: 'WETH',
        destination: 'AssetHubPolkadot'
      } as TSendInternalOptions<ApiPromise, Extrinsic>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(false)
    })

    it('should return false when currencySymbol is DOT and destination is AssetHubPolkadot', () => {
      const options: TSendInternalOptions<ApiPromise, Extrinsic> = {
        currencySymbol: 'DOT',
        destination: 'AssetHubPolkadot'
      } as TSendInternalOptions<ApiPromise, Extrinsic>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(false)
    })

    it('should return true when currencySymbol is not WETH or DOT and destination is AssetHubPolkadot', () => {
      const options: TSendInternalOptions<ApiPromise, Extrinsic> = {
        currencySymbol: 'BNC',
        destination: 'AssetHubPolkadot'
      } as TSendInternalOptions<ApiPromise, Extrinsic>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(true)
    })

    it('should return true when currencySymbol is WETH but destination is not AssetHubPolkadot', () => {
      const options: TSendInternalOptions<ApiPromise, Extrinsic> = {
        currencySymbol: 'WETH',
        destination: 'Acala'
      } as TSendInternalOptions<ApiPromise, Extrinsic>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(true)
    })

    it('should return true when currencySymbol is DOT but destination is not AssetHubPolkadot', () => {
      const options: TSendInternalOptions<ApiPromise, Extrinsic> = {
        currencySymbol: 'DOT',
        destination: 'Acala'
      } as TSendInternalOptions<ApiPromise, Extrinsic>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(true)
    })
  })
})
