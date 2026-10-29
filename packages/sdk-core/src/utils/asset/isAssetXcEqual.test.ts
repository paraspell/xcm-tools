import type { TAssetInfo } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import type { PolkadotApi } from '../../api'
import { localizeLocation } from '../location'
import { isAssetXcEqualImpl } from './isAssetXcEqual'

const api = { localizeLocation } as unknown as PolkadotApi<unknown, unknown, unknown>

const asset = (location: TLocation) => ({ location }) as TAssetInfo

const RELAY = asset({ parents: 1, interior: { Here: null } })
const DOT_ON_KUSAMA = asset({
  parents: 2,
  interior: { X1: [{ GlobalConsensus: { polkadot: null } }] }
})
const KSM_ON_POLKADOT = asset({
  parents: 2,
  interior: { X1: [{ GlobalConsensus: { kusama: null } }] }
})
const USDT = asset({
  parents: 1,
  interior: { X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }] }
})
const USDT_ON_KUSAMA = asset({
  parents: 2,
  interior: {
    X4: [
      { GlobalConsensus: { polkadot: null } },
      { Parachain: 1000 },
      { PalletInstance: 50 },
      { GeneralIndex: 1984 }
    ]
  }
})

describe('isAssetXcEqualImpl', () => {
  it('matches the same asset referenced by different locations across ecosystems', () => {
    expect(
      isAssetXcEqualImpl(
        api,
        { chain: 'AssetHubKusama', asset: DOT_ON_KUSAMA },
        { chain: 'AssetHubPolkadot', asset: RELAY }
      )
    ).toBe(true)
    expect(
      isAssetXcEqualImpl(
        api,
        { chain: 'AssetHubPolkadot', asset: RELAY },
        { chain: 'AssetHubKusama', asset: DOT_ON_KUSAMA }
      )
    ).toBe(true)
    expect(
      isAssetXcEqualImpl(
        api,
        { chain: 'AssetHubPolkadot', asset: KSM_ON_POLKADOT },
        { chain: 'AssetHubKusama', asset: RELAY }
      )
    ).toBe(true)
    expect(
      isAssetXcEqualImpl(
        api,
        { chain: 'AssetHubKusama', asset: USDT_ON_KUSAMA },
        { chain: 'AssetHubPolkadot', asset: USDT }
      )
    ).toBe(true)
  })

  it('matches the same asset within one ecosystem', () => {
    expect(
      isAssetXcEqualImpl(
        api,
        { chain: 'Hydration', asset: RELAY },
        { chain: 'AssetHubPolkadot', asset: RELAY }
      )
    ).toBe(true)
    expect(
      isAssetXcEqualImpl(
        api,
        { chain: 'AssetHubPolkadot', asset: USDT },
        { chain: 'Hydration', asset: USDT }
      )
    ).toBe(true)
  })

  it('does not match different assets sharing the same location across ecosystems', () => {
    expect(
      isAssetXcEqualImpl(
        api,
        { chain: 'AssetHubKusama', asset: RELAY },
        { chain: 'AssetHubPolkadot', asset: RELAY }
      )
    ).toBe(false)
    expect(
      isAssetXcEqualImpl(
        api,
        { chain: 'AssetHubKusama', asset: DOT_ON_KUSAMA },
        { chain: 'AssetHubPolkadot', asset: KSM_ON_POLKADOT }
      )
    ).toBe(false)
  })
})
