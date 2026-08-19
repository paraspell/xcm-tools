import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { getChain } from '../../utils/getChain'
import type Jamton from './Jamton'

vi.mock('../../pallets/polkadotXcm')

describe('Jamton', () => {
  let chain: Jamton<unknown, unknown, unknown>

  const baseInput = {
    assetInfo: {},
    scenario: 'ParaToPara' as const,
    destination: 'AssetHubPolkadot' as const,
    version: Version.V4
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  const usdtAsset: TAssetInfo = {
    symbol: 'USDT',
    assetId: '123',
    decimals: 6,
    location: {
      parents: 1,
      interior: {
        X1: [{ Parachain: 1000 }]
      }
    }
  }

  beforeEach(() => {
    vi.resetAllMocks()
    chain = getChain<unknown, unknown, unknown, 'Jamton'>('Jamton')
  })

  describe('initialization', () => {
    it('should initialize with correct values', () => {
      expect(chain.chain).toBe('Jamton')
      expect(chain.info).toBe('jamton')
      expect(chain.ecosystem).toBe('Polkadot')
      expect(chain.version).toBe(Version.V4)
    })
  })

  it('uses custom currency IDs for minting', () => {
    expect(chain['getMintConfig']()).toEqual({ useCustomCurrencyId: true })
  })

  it('uses the custom currency ID for local transfers', () => {
    const api = {} as PolkadotApi<unknown, unknown, unknown>
    expect(chain['getLocalCurrencyId'](api, usdtAsset)).toEqual({ ForeignAsset: 123 })
  })

  it('should handle native asset', async () => {
    const input = {
      ...baseInput,
      assetInfo: { symbol: 'DOTON', isNative: true, amount: 100n }
    } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })

  it('should handle foreign asset', async () => {
    const input = {
      ...baseInput,
      assetInfo: { ...usdtAsset, amount: 100n }
    }
    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })

  it('should throw ScenarioNotSupportedError for ParaToPara to non-AssetHubPolkadot', () => {
    const input = {
      ...baseInput,
      assetInfo: { ...usdtAsset, amount: 100n },
      scenario: 'ParaToPara' as const,
      destination: 'Acala' as const
    }
    expect(() => chain.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
    expect(() => chain.transferPolkadotXCM(input)).toThrow(
      'Transfer from Jamton to "Acala" is not yet supported'
    )
  })

  it('should allow ParaToPara to AssetHubPolkadot', async () => {
    const input = {
      ...baseInput,
      assetInfo: { ...usdtAsset, amount: 100n },
      scenario: 'ParaToPara' as const,
      destination: 'AssetHubPolkadot' as const
    }
    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })

  it('should allow non-ParaToPara scenarios to any destination', async () => {
    const input = {
      ...baseInput,
      assetInfo: { ...usdtAsset, amount: 100n },
      scenario: 'ParaToRelay' as const,
      destination: 'Acala' as const
    }
    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })

  it.each([
    ['WUD', 31337],
    ['PINK', 23]
  ])('uses the normal transfer path for %s by location', async (symbol, generalIndex) => {
    const input = {
      ...baseInput,
      assetInfo: {
        symbol,
        amount: 1000n,
        location: {
          parents: 1,
          interior: {
            X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: generalIndex }]
          }
        }
      }
    } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

    await chain.transferPolkadotXCM(input)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(input)
  })
})
