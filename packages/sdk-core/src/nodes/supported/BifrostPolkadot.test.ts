import type { TAsset, WithAmount } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { transferXTokens } from '../../pallets/xTokens'
import { createTypeAndThenCall } from '../../transfer'
import type {
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TTransferLocalOptions,
  TXTokensTransferOptions
} from '../../types'
import { assertHasLocation, getNode } from '../../utils'
import { createMultiAsset } from '../../utils/multiAsset'
import type BifrostPolkadot from './BifrostPolkadot'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

vi.mock('../../transfer', () => ({
  createTypeAndThenCall: vi.fn()
}))

describe('BifrostPolkadot', () => {
  let bifrostPolkadot: BifrostPolkadot<unknown, unknown>
  const mockXTokensInput = {
    asset: { symbol: 'BNC', amount: 100n }
  } as TXTokensTransferOptions<unknown, unknown>

  const api = {
    callTxMethod: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockPolkadotXCMInput = {
    api,
    asset: { symbol: 'WETH', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    bifrostPolkadot = getNode<unknown, unknown, 'BifrostPolkadot'>('BifrostPolkadot')
  })

  it('should initialize with correct values', () => {
    expect(bifrostPolkadot.node).toBe('BifrostPolkadot')
    expect(bifrostPolkadot.info).toBe('bifrost')
    expect(bifrostPolkadot.type).toBe('polkadot')
    expect(bifrostPolkadot.version).toBe(Version.V5)
  })

  it('should call transferXTokens with Native when currency matches native asset', () => {
    vi.spyOn(bifrostPolkadot, 'getNativeAssetSymbol').mockReturnValue('BNC')

    bifrostPolkadot.transferXTokens(mockXTokensInput)

    expect(transferXTokens).toHaveBeenCalledWith(mockXTokensInput, { Native: 'BNC' })
  })

  it('should call transferPolkadotXCM with correct parameters for WETH transfer', async () => {
    const asset = {
      symbol: 'WETH',
      amount: 100n,
      multiLocation: { parents: 1, interior: 'Here' }
    } as WithAmount<TAsset>

    await bifrostPolkadot.transferPolkadotXCM({ ...mockPolkadotXCMInput, asset })

    assertHasLocation(asset)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      {
        ...mockPolkadotXCMInput,
        asset,
        multiAsset: createMultiAsset(bifrostPolkadot.version, asset.amount, asset.multiLocation)
      },
      'transfer_assets',
      'Unlimited'
    )
  })

  it('should call transferPolkadotXCM with correct parameters for DOT transfer', async () => {
    const asset = {
      symbol: 'DOT',
      amount: 100n,
      multiLocation: { parents: 1, interior: 'Here' }
    } as WithAmount<TAsset>

    await bifrostPolkadot.transferPolkadotXCM({
      ...mockPolkadotXCMInput,
      asset
    })

    expect(createTypeAndThenCall).toHaveBeenCalledTimes(1)
  })

  it('should throw error when destination is Ethereum', () => {
    const inputEth = {
      ...mockPolkadotXCMInput,
      destination: 'Ethereum',
      scenario: 'ParaToPara'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    expect(() => bifrostPolkadot.transferPolkadotXCM(inputEth)).toThrow(
      'Snowbridge is temporarily disabled'
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
        asset: { symbol: 'ACA', amount: 100n, assetId: '1' },
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
