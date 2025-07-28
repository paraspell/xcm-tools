import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Parents, type TLocation } from '../../types'
import { flattenJunctions } from './flattenJunctions'
import { getJunctionValue, hasJunction } from './junctions'

vi.mock('./flattenJunctions', () => ({
  flattenJunctions: vi.fn()
}))

describe('hasJunction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns false when location.interior is 'Here'", () => {
    const location: TLocation = { parents: Parents.ZERO, interior: 'Here' }
    expect(hasJunction(location, 'Parachain')).toBe(false)
  })

  it('returns true when a matching junction exists and no junctionValue is provided', () => {
    const location: TLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([{ Parachain: 42 }])
    expect(hasJunction(location, 'Parachain')).toBe(true)
  })

  it('returns false when a matching junction exists but the junction value does not match', () => {
    const location: TLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([{ Parachain: 42 }])
    expect(hasJunction(location, 'Parachain', 43)).toBe(false)
  })

  it('returns true when a matching junction exists and the junction value matches', () => {
    const location: TLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([{ Parachain: 'bar' }])
    expect(hasJunction(location, 'Parachain', 'bar')).toBe(true)
  })

  it('returns true if any junction in the flattened array satisfies the criteria', () => {
    const location: TLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([
      { AccountId32: { id: '0x123' } },
      { Parachain: 2 }
    ])
    expect(hasJunction(location, 'Parachain', 2)).toBe(true)
  })

  it('ignores junction objects with multiple keys', () => {
    const location: TLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([{ Parachain: 1, AccountId32: { id: '0x123' } }])
    expect(hasJunction(location, 'Parachain', 1)).toBe(false)
  })

  it('returns false when no matching junction is found', () => {
    const location: TLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([{ AccountId32: { id: '0x123' } }])
    expect(hasJunction(location, 'Parachain')).toBe(false)
  })

  it('returns false when flattenJunctions returns an empty array', () => {
    const location: TLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([])
    expect(hasJunction(location, 'Parachain')).toBe(false)
  })

  it('returns true when a matching junction exists and JSON.stringify fails', () => {
    const location: TLocation = {
      parents: Parents.ZERO,
      interior: {
        X1: [{ Parachain: 1000n }]
      }
    }
    vi.mocked(flattenJunctions).mockReturnValue([{ Parachain: 1000n }])
    expect(hasJunction(location, 'Parachain', 1000n)).toBe(true)
  })
})

describe('getJunctionValue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns undefined when location.interior is 'Here'", () => {
    const location: TLocation = { parents: Parents.ZERO, interior: 'Here' }
    expect(getJunctionValue(location, 'Parachain')).toBeUndefined()
  })

  it('returns the junction value when a matching junction exists', () => {
    const location: TLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([{ Parachain: 42 }])
    expect(getJunctionValue(location, 'Parachain')).toBe(42)
  })

  it('returns the first matching junction value when multiple junctions of the same type exist', () => {
    const location: TLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([
      { Parachain: 42 },
      { AccountId32: { id: '0x123' } },
      { Parachain: 84 }
    ])
    expect(getJunctionValue(location, 'Parachain')).toBe(42)
  })

  it('returns complex object values correctly', () => {
    const accountValue = { id: '0x123', network: 'Polkadot' }
    const location: TLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([{ AccountId32: accountValue }])
    expect(getJunctionValue(location, 'AccountId32')).toEqual(accountValue)
  })

  it('ignores junction objects with multiple keys', () => {
    const location: TLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([
      { Parachain: 1, AccountId32: { id: '0x123' } },
      { Parachain: 42 }
    ])
    expect(getJunctionValue(location, 'Parachain')).toBe(42)
  })

  it('returns undefined when no matching junction is found', () => {
    const location: TLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([{ AccountId32: { id: '0x123' } }])
    expect(getJunctionValue(location, 'Parachain')).toBeUndefined()
  })

  it('returns undefined when flattenJunctions returns an empty array', () => {
    const location: TLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([])
    expect(getJunctionValue(location, 'Parachain')).toBeUndefined()
  })

  it('returns bigint values correctly', () => {
    const location: TLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([{ Parachain: 1000n }])
    expect(getJunctionValue(location, 'Parachain')).toBe(1000n)
  })

  it('returns undefined values correctly', () => {
    const location: TLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([{ Parachain: undefined }])
    expect(getJunctionValue(location, 'Parachain')).toBeUndefined()
  })

  it('returns string values correctly', () => {
    const location: TLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([{ Parachain: 'test-value' }])
    expect(getJunctionValue(location, 'Parachain')).toBe('test-value')
  })
})
