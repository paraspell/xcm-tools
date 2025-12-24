import { Parents, type TLocation } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { STABLECOIN_IDS } from '../../consts/consts'
import type { TAssetInfo } from '../../types'
import { getOtherAssets } from '../assets'
import { findStablecoinAssets } from './findStablecoinAssets'

vi.mock('../assets')

describe('findStablecoinAssets', () => {
  const stableLocation = (id: number, withGlobalConsensus = false): TLocation => ({
    parents: Parents.ONE,
    interior: withGlobalConsensus
      ? {
          X3: [
            { GlobalConsensus: { polkadot: null } },
            { PalletInstance: 50 },
            { GeneralIndex: id }
          ]
        }
      : {
          X2: [{ PalletInstance: 50 }, { GeneralIndex: id }]
        }
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns one stablecoin per id and prefers GlobalConsensus variant', () => {
    const stable1984Consensus: TAssetInfo = {
      symbol: 'USD1',
      decimals: 12,
      location: stableLocation(STABLECOIN_IDS[0], true)
    }
    const stable1984Local: TAssetInfo = {
      symbol: 'USD1-LOCAL',
      decimals: 12,
      location: stableLocation(STABLECOIN_IDS[0])
    }
    const stable1337: TAssetInfo = {
      symbol: 'USD2',
      decimals: 12,
      location: stableLocation(STABLECOIN_IDS[1])
    }

    vi.mocked(getOtherAssets).mockReturnValue([stable1984Local, stable1337, stable1984Consensus])

    const result = findStablecoinAssets('AssetHubPolkadot')

    expect(result).toHaveLength(STABLECOIN_IDS.length)
    expect(result[0]).toEqual(stable1984Consensus)
    expect(result[1]).toEqual(stable1337)
  })

  it('returns undefined entries when no assets match a stablecoin id', () => {
    vi.mocked(getOtherAssets).mockReturnValue([])

    const result = findStablecoinAssets('AssetHubPolkadot')

    expect(result).toHaveLength(STABLECOIN_IDS.length)
    expect(result.every(item => item === undefined)).toBe(true)
  })
})
