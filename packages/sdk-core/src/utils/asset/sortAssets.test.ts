import type { TAsset } from '@paraspell/assets'
import type { TLocation } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { compareLocationOrder, sortAssets } from './sortAssets'

const ETHEREUM = { GlobalConsensus: { Ethereum: { chainId: 1 } } }
const CGT: TLocation = {
  parents: 2,
  interior: {
    X2: [
      ETHEREUM,
      { AccountKey20: { network: null, key: '0x0e186357c323c806c1efdad36d217f7a54b63d18' } }
    ]
  }
}
const KSM: TLocation = { parents: 2, interior: { X1: [{ GlobalConsensus: { kusama: null } }] } }
const DOT_FROM_KUSAMA: TLocation = {
  parents: 2,
  interior: { X1: [{ GlobalConsensus: { polkadot: null } }] }
}
const USDT_FROM_KUSAMA: TLocation = {
  parents: 2,
  interior: {
    X4: [
      { GlobalConsensus: { polkadot: null } },
      { Parachain: 1000 },
      { PalletInstance: 50 },
      { GeneralIndex: 1984 }
    ]
  }
}
const RELAY: TLocation = { parents: 1, interior: { Here: null } }
const USDT: TLocation = {
  parents: 1,
  interior: { X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }] }
}
const USDC: TLocation = {
  parents: 1,
  interior: { X3: [{ Parachain: 1000 }, { PalletInstance: 50 }, { GeneralIndex: 1337 }] }
}
const PARA: TLocation = { parents: 1, interior: { X1: { Parachain: 2000 } } }

const asset = (location: TLocation): TAsset => ({ id: location, fun: { Fungible: 1n } })
const locations = (assets: TAsset[]) => assets.map(a => a.id)

describe('compareLocationOrder', () => {
  it('orders by parents first', () => {
    expect(compareLocationOrder({ parents: 0, interior: 'Here' }, RELAY)).toBeLessThan(0)
    expect(compareLocationOrder(KSM, RELAY)).toBeGreaterThan(0)
  })

  it('orders Here before any junctions and shorter junction lists first', () => {
    expect(compareLocationOrder(RELAY, USDT)).toBeLessThan(0)
    expect(compareLocationOrder(PARA, USDT)).toBeLessThan(0)
    expect(compareLocationOrder(KSM, CGT)).toBeLessThan(0)
    expect(compareLocationOrder(CGT, USDT_FROM_KUSAMA)).toBeLessThan(0)
  })

  it('orders junctions of the same length by variant and then by value', () => {
    expect(compareLocationOrder(USDC, USDT)).toBeLessThan(0)
    expect(
      compareLocationOrder(
        { parents: 1, interior: { X1: { Parachain: 1000 } } },
        { parents: 1, interior: { X1: { PalletInstance: 1 } } }
      )
    ).toBeLessThan(0)
    expect(
      compareLocationOrder(
        { parents: 1, interior: { X1: { Parachain: 1000 } } },
        { parents: 1, interior: { X1: { Parachain: '2000' } } }
      )
    ).toBeLessThan(0)
  })

  it('orders global consensus by network id in either notation', () => {
    expect(compareLocationOrder(DOT_FROM_KUSAMA, KSM)).toBeLessThan(0)
    expect(compareLocationOrder(KSM, { parents: 2, interior: { X1: [ETHEREUM] } })).toBeLessThan(0)
    expect(
      compareLocationOrder(
        { parents: 2, interior: { X1: [{ GlobalConsensus: 'Polkadot' }] } },
        { parents: 2, interior: { X1: [{ GlobalConsensus: { kusama: null } }] } }
      )
    ).toBeLessThan(0)
    expect(
      compareLocationOrder(
        { parents: 2, interior: { X1: [{ GlobalConsensus: { Ethereum: { chainId: 1 } } }] } },
        { parents: 2, interior: { X1: [{ GlobalConsensus: { Ethereum: { chainId: 11155111 } } }] } }
      )
    ).toBeLessThan(0)
  })

  it('returns 0 for equal locations', () => {
    expect(compareLocationOrder(CGT, { ...CGT })).toBe(0)
    expect(compareLocationOrder(RELAY, { parents: 1, interior: 'Here' })).toBe(0)
  })
})

describe('sortAssets', () => {
  it('sorts a bridged asset with a foreign-consensus fee asset', () => {
    expect(locations(sortAssets([asset(CGT), asset(KSM)]))).toEqual([KSM, CGT])
    expect(locations(sortAssets([asset(CGT), asset(DOT_FROM_KUSAMA)]))).toEqual([
      DOT_FROM_KUSAMA,
      CGT
    ])
    expect(locations(sortAssets([asset(USDT_FROM_KUSAMA), asset(CGT)]))).toEqual([
      CGT,
      USDT_FROM_KUSAMA
    ])
  })

  it('sorts local assets after the relay asset and by general index', () => {
    expect(locations(sortAssets([asset(USDT), asset(USDC), asset(RELAY), asset(PARA)]))).toEqual([
      RELAY,
      PARA,
      USDC,
      USDT
    ])
  })

  it('sorts in place and returns the same array', () => {
    const assets = [asset(CGT), asset(KSM)]
    expect(sortAssets(assets)).toBe(assets)
  })
})
