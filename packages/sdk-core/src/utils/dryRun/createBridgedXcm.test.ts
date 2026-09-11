import { Version } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { createBridgedXcmPrefix } from './createBridgedXcm'

describe('createBridgedXcm', () => {
  const params = {
    palletIndex: 53,
    relay: 'Polkadot' as const,
    paraId: 1000,
    destination: { parents: 1, interior: { X1: [{ Parachain: 1001 }] } }
  }

  it('creates the origin prefix instructions', () => {
    expect(createBridgedXcmPrefix(Version.V5, params)).toEqual([
      { DescendOrigin: { X1: [{ PalletInstance: 53 }] } },
      { UniversalOrigin: { GlobalConsensus: { polkadot: null } } },
      { DescendOrigin: { X1: [{ Parachain: 1000 }] } }
    ])
  })

  it('uses the V3 junction shape', () => {
    expect(createBridgedXcmPrefix(Version.V3, params)[0]).toEqual({
      DescendOrigin: { X1: { PalletInstance: 53 } }
    })
  })
})
