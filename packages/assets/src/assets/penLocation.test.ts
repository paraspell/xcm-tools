import { describe, expect, it } from 'vitest'

import { findAssetInfo } from './search/findAssetInfo'
import { findAssetInfoOnDest } from './search/findAssetInfoOnDest'

describe('BifrostPolkadot PEN location', () => {
  // Regression: Bifrost's on-chain entry for PEN stores Pendulum's local view of
  // its native token, which used to be expanded into a self-referential location
  // (Parachain 2030 = Bifrost itself) that blocked every PEN route involving
  // Bifrost. See the location override in scripts/fetchers/bifrost.ts.
  it('resolves PEN to Pendulum (para 2094), not to Bifrost itself (para 2030)', () => {
    const asset = findAssetInfo('BifrostPolkadot', { symbol: 'PEN' })

    expect(asset?.location).toEqual({
      parents: 1,
      interior: { X2: [{ Parachain: 2094 }, { PalletInstance: 10 }] }
    })
  })

  it('resolves PEN between BifrostPolkadot and Pendulum in both directions', () => {
    const forward = findAssetInfoOnDest('BifrostPolkadot', 'Pendulum', { symbol: 'PEN' })
    const backward = findAssetInfoOnDest('Pendulum', 'BifrostPolkadot', { symbol: 'PEN' })

    expect(forward).not.toBeNull()
    expect(backward).not.toBeNull()
  })
})
