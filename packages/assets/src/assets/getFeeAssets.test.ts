import type { TLocation, TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { InvalidCurrencyError } from '../errors'
import type { TAssetInfo, TForeignAssetInfo, TNativeAssetInfo, TChainAssetsInfo } from '../types'
import { getAssetsObject } from './assets'
import { getFeeAssets } from './getFeeAssets'

vi.mock('./assets', () => ({
  getAssetsObject: vi.fn()
}))

const createAsset = (symbol: string, opts: Partial<TAssetInfo> = {}): TForeignAssetInfo => ({
  symbol,
  decimals: 12,
  existentialDeposit: '0',
  location: {} as TLocation,
  ...opts
})

const NODE = 'TestNode' as TNodeDotKsmWithRelayChains

describe('getFeeAssets', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns fee‑flagged assets (flag stripped) and appends native asset if missing', () => {
    const feeAsset = createAsset('FEE', { isFeeAsset: true })
    const mainNative = createAsset('NATIVE', { isNative: true })

    const assetsObject = {
      nativeAssets: [mainNative],
      otherAssets: [feeAsset],
      nativeAssetSymbol: 'NATIVE'
    } as TChainAssetsInfo

    vi.mocked(getAssetsObject).mockReturnValueOnce(assetsObject)

    const result = getFeeAssets(NODE)

    const { isFeeAsset: _flag, ...feeAssetWithoutFlag } = feeAsset

    expect(result).toEqual([feeAssetWithoutFlag, mainNative])
  })

  it('falls back to the main native asset when no fee assets are present', () => {
    const mainNative = createAsset('NATIVE', { isNative: true }) as TNativeAssetInfo

    const assetsObject = {
      nativeAssets: [mainNative],
      otherAssets: [createAsset('FOO')],
      nativeAssetSymbol: 'NATIVE'
    } as TChainAssetsInfo

    vi.mocked(getAssetsObject).mockReturnValueOnce(assetsObject)

    const result = getFeeAssets(NODE)

    expect(result).toEqual([mainNative])
  })

  it('throws InvalidCurrencyError when neither fee assets nor main native asset exist', () => {
    const otherNative = createAsset('BAR', { isNative: true }) as TNativeAssetInfo

    const assetsObject = {
      nativeAssets: [otherNative],
      otherAssets: [] as TForeignAssetInfo[],
      nativeAssetSymbol: 'NATIVE'
    } as TChainAssetsInfo

    vi.mocked(getAssetsObject).mockReturnValueOnce(assetsObject)

    expect(() => getFeeAssets(NODE)).toThrow(InvalidCurrencyError)
  })
})
