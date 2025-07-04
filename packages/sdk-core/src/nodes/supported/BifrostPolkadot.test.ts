import type { TAsset, WithAmount } from '@paraspell/assets'
import { getAssetId } from '@paraspell/assets'
import { Parents, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DOT_MULTILOCATION, ETHEREUM_JUNCTION } from '../../constants'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { transferXTokens } from '../../pallets/xTokens'
import type {
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TTransferLocalOptions,
  TXTokensTransferOptions
} from '../../types'
import { getNode } from '../../utils'
import { createMultiAsset } from '../../utils/multiAsset'
import type BifrostPolkadot from './BifrostPolkadot'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
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
    expect(bifrostPolkadot.version).toBe(Version.V4)
  })

  it('should call transferXTokens with Native when currency matches native asset', () => {
    vi.spyOn(bifrostPolkadot, 'getNativeAssetSymbol').mockReturnValue('BNC')

    bifrostPolkadot.transferXTokens(mockXTokensInput)

    expect(transferXTokens).toHaveBeenCalledWith(mockXTokensInput, { Native: 'BNC' })
  })

  it('should call transferPolkadotXCM with correct parameters for WETH transfer', async () => {
    await bifrostPolkadot.transferPolkadotXCM(mockPolkadotXCMInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      {
        ...mockPolkadotXCMInput,
        multiAsset: createMultiAsset(bifrostPolkadot.version, mockPolkadotXCMInput.asset.amount, {
          parents: Parents.TWO,
          interior: {
            X2: [
              ETHEREUM_JUNCTION,
              {
                AccountKey20: { key: getAssetId('Ethereum', 'WETH') ?? '' }
              }
            ]
          }
        })
      },
      'transfer_assets',
      'Unlimited'
    )
  })

  it('should call transferPolkadotXCM with correct parameters for DOT transfer', async () => {
    const asset = { symbol: 'DOT', amount: '100' } as WithAmount<TAsset>

    await bifrostPolkadot.transferPolkadotXCM({
      ...mockPolkadotXCMInput,
      asset
    })

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      {
        ...mockPolkadotXCMInput,
        asset,
        multiAsset: createMultiAsset(
          bifrostPolkadot.version,
          mockPolkadotXCMInput.asset.amount,
          DOT_MULTILOCATION
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
        to: 'AssetHubPolkadot'
      } as TSendInternalOptions<unknown, unknown>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(false)
    })

    it('should return false when currency symbol is DOT and destination is AssetHubPolkadot', () => {
      const options: TSendInternalOptions<unknown, unknown> = {
        asset: { symbol: 'DOT' },
        to: 'AssetHubPolkadot'
      } as TSendInternalOptions<unknown, unknown>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(false)
    })

    it('should return true when currency symbol is not WETH or DOT and destination is AssetHubPolkadot', () => {
      const options: TSendInternalOptions<unknown, unknown> = {
        asset: { symbol: 'BNC' },
        to: 'AssetHubPolkadot'
      } as TSendInternalOptions<unknown, unknown>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(true)
    })

    it('should return true when currency symbol is WETH but destination is not AssetHubPolkadot', () => {
      const options: TSendInternalOptions<unknown, unknown> = {
        asset: { symbol: 'WETH' },
        to: 'Acala'
      } as TSendInternalOptions<unknown, unknown>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(true)
    })

    it('should return true when currency ymbol is DOT but destination is not AssetHubPolkadot', () => {
      const options: TSendInternalOptions<unknown, unknown> = {
        asset: { symbol: 'DOT' },
        to: 'Acala'
      } as TSendInternalOptions<unknown, unknown>
      expect(bifrostPolkadot['canUseXTokens'](options)).toBe(true)
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100', assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      bifrostPolkadot.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith({
        module: 'Tokens',
        method: 'transfer',
        parameters: {
          dest: { Id: mockOptions.address },
          currency_id: { Token2: 1 },
          amount: BigInt(mockOptions.asset.amount)
        }
      })
    })
  })
})
