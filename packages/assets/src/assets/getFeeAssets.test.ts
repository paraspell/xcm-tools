import type { TChain, TLocation } from '@paraspell/sdk-common'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { InvalidCurrencyError } from '../errors'
import type { TAssetInfo, TChainAssetsInfo } from '../types'
import { getAssetsObject } from './assets'
import { getFeeAssets } from './getFeeAssets'
import { findNativeAssetInfoOrThrow } from './search'

vi.mock('./assets')
vi.mock('./search')

const createAsset = (symbol: string, opts: Partial<TAssetInfo> = {}): TAssetInfo => ({
  symbol,
  decimals: 12,
  existentialDeposit: '0',
  location: {} as TLocation,
  ...opts
})

const mockChain = 'TestChain' as TChain

describe('getFeeAssets', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns fee‑flagged assets (flag stripped) and appends native asset if missing', () => {
    const feeAsset = createAsset('FEE', { isFeeAsset: true })
    const mainNative = createAsset('NATIVE', { isNative: true })

    const assetsObject = {
      nativeAssetSymbol: 'NATIVE',
      assets: [mainNative, feeAsset]
    } as TChainAssetsInfo

    vi.mocked(getAssetsObject).mockReturnValueOnce(assetsObject)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValueOnce(mainNative)

    const result = getFeeAssets(mockChain)

    const { isFeeAsset: _flag, ...feeAssetWithoutFlag } = feeAsset

    expect(result).toEqual([feeAssetWithoutFlag, mainNative])
  })

  it('falls back to the main native asset when no fee assets are present', () => {
    const mainNative = createAsset('NATIVE', { isNative: true })

    const assetsObject = {
      nativeAssetSymbol: 'NATIVE',
      assets: [mainNative, createAsset('FOO')]
    } as TChainAssetsInfo

    vi.mocked(getAssetsObject).mockReturnValueOnce(assetsObject)
    vi.mocked(findNativeAssetInfoOrThrow).mockReturnValueOnce(mainNative)

    const result = getFeeAssets(mockChain)

    expect(result).toEqual([mainNative])
  })

  it('throws InvalidCurrencyError when neither fee assets nor main native asset exist', () => {
    const otherNative = createAsset('BAR', { isNative: true })

    const assetsObject = {
      nativeAssetSymbol: 'NATIVE',
      assets: [otherNative]
    } as TChainAssetsInfo

    vi.mocked(getAssetsObject).mockReturnValueOnce(assetsObject)
    vi.mocked(findNativeAssetInfoOrThrow).mockImplementationOnce(() => {
      throw new InvalidCurrencyError('Native asset not found')
    })

    expect(() => getFeeAssets(mockChain)).toThrow(InvalidCurrencyError)
  })
})
