import type { TAsset, TAssetInfo } from '@paraspell/assets'
import { findAssetInfoOrThrow, isSymbolMatch } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { assertHasLocation, createAsset } from '../../utils'
import { getChain } from '../../utils/getChain'
import type Jamton from './Jamton'

vi.mock('@paraspell/assets')

vi.mock('../../pallets/polkadotXcm')
vi.mock('../../utils')

describe('Jamton', () => {
  let chain: Jamton<unknown, unknown>

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, 'Jamton'>('Jamton')
  })

  describe('initialization', () => {
    it('should initialize with correct values', () => {
      expect(chain.chain).toBe('Jamton')
      expect(chain.info).toBe('jamton')
      expect(chain.ecosystem).toBe('Polkadot')
      expect(chain.version).toBe(Version.V4)
    })
  })

  const baseInput = {
    assetInfo: {},
    scenario: 'ParaToPara' as const,
    destination: 'AssetHubPolkadot' as const,
    version: Version.V4
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  it('should handle native asset', async () => {
    const input = {
      ...baseInput,
      assetInfo: { symbol: 'DOTON', isNative: true, amount: 100n }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })

  it('should handle foreign asset', async () => {
    const input = {
      ...baseInput,
      assetInfo: { symbol: 'USDT', assetId: '123', decimals: 6, amount: 100n }
    }
    vi.mocked(isSymbolMatch).mockReturnValue(false)

    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })

  it('should throw ScenarioNotSupportedError for ParaToPara to non-AssetHubPolkadot', () => {
    const input = {
      ...baseInput,
      assetInfo: { symbol: 'USDT', assetId: '123', decimals: 6, amount: 100n },
      scenario: 'ParaToPara' as const,
      destination: 'Acala' as const
    }
    vi.mocked(isSymbolMatch).mockReturnValue(false)

    expect(() => chain.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    expect(() => chain.transferPolkadotXCM(input)).toThrow(
      'Transfer from Jamton to "Acala" is not yet supported'
    )
  })

  it('should allow ParaToPara to AssetHubPolkadot', async () => {
    const input = {
      ...baseInput,
      assetInfo: { symbol: 'USDT', assetId: '123', decimals: 6, amount: 100n },
      scenario: 'ParaToPara' as const,
      destination: 'AssetHubPolkadot' as const
    }
    vi.mocked(isSymbolMatch).mockReturnValue(false)

    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })

  it('should allow non-ParaToPara scenarios to any destination', async () => {
    const input = {
      ...baseInput,
      assetInfo: { symbol: 'USDT', assetId: '123', decimals: 6, amount: 100n },
      scenario: 'ParaToRelay' as const,
      destination: 'Acala' as const
    }
    vi.mocked(isSymbolMatch).mockReturnValue(false)

    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })

  it('should handle WUD symbol with multi-asset transfer', async () => {
    const mockUsdtAsset = {
      symbol: 'USDt',
      location: {}
    } as TAssetInfo

    const input = {
      ...baseInput,
      assetInfo: {
        symbol: 'WUD',
        assetId: '456',
        amount: 1000n,
        location: {}
      }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    vi.mocked(isSymbolMatch).mockReturnValue(true)
    vi.mocked(findAssetInfoOrThrow).mockReturnValue(mockUsdtAsset)
    vi.mocked(createAsset)
      .mockReturnValueOnce({
        mockAsset: 'usdt',
        isFeeAsset: true
      } as unknown as TAsset)
      .mockReturnValueOnce({ mockAsset: 'wud' } as unknown as TAsset)

    await chain.transferPolkadotXCM(input)

    expect(isSymbolMatch).toHaveBeenCalledWith('WUD', 'WUD')
    expect(findAssetInfoOrThrow).toHaveBeenCalledWith('Jamton', { symbol: 'USDt' }, null)
    expect(assertHasLocation).toHaveBeenCalledWith(input.assetInfo)
    expect(assertHasLocation).toHaveBeenCalledWith(mockUsdtAsset)
    expect(createAsset).toHaveBeenCalledWith(Version.V4, 180_000n, mockUsdtAsset.location)
    expect(createAsset).toHaveBeenCalledWith(Version.V4, 1000n, input.assetInfo.location)

    expect(transferPolkadotXcm).toHaveBeenCalledWith({
      ...input,
      overriddenAsset: [{ mockAsset: 'usdt', isFeeAsset: true }, { mockAsset: 'wud' }]
    })
  })

  it('should not treat non-WUD symbols as WUD', async () => {
    const input = {
      ...baseInput,
      assetInfo: { symbol: 'USDT', assetId: '123', decimals: 6, amount: 100n }
    }
    vi.mocked(isSymbolMatch).mockReturnValue(false)

    await chain.transferPolkadotXCM(input)

    expect(findAssetInfoOrThrow).not.toHaveBeenCalled()
    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })
})
