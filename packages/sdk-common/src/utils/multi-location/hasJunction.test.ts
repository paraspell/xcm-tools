import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Parents, type TMultiLocation } from '../../types'
import { flattenJunctions } from './flattenJunctions'
import { hasJunction } from './hasJunction'

vi.mock('./flattenJunctions', () => ({
  flattenJunctions: vi.fn()
}))

describe('hasJunction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns false when multiLocation.interior is 'Here'", () => {
    const multiLocation: TMultiLocation = { parents: Parents.ZERO, interior: 'Here' }
    expect(hasJunction(multiLocation, 'Parachain')).toBe(false)
  })

  it('returns true when a matching junction exists and no junctionValue is provided', () => {
    const multiLocation: TMultiLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([{ Parachain: 42 }])
    expect(hasJunction(multiLocation, 'Parachain')).toBe(true)
  })

  it('returns false when a matching junction exists but the junction value does not match', () => {
    const multiLocation: TMultiLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([{ Parachain: 42 }])
    expect(hasJunction(multiLocation, 'Parachain', 43)).toBe(false)
  })

  it('returns true when a matching junction exists and the junction value matches', () => {
    const multiLocation: TMultiLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([{ Parachain: 'bar' }])
    expect(hasJunction(multiLocation, 'Parachain', 'bar')).toBe(true)
  })

  it('returns true if any junction in the flattened array satisfies the criteria', () => {
    const multiLocation: TMultiLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([
      { AccountId32: { id: '0x123' } },
      { Parachain: 2 }
    ])
    expect(hasJunction(multiLocation, 'Parachain', 2)).toBe(true)
  })

  it('ignores junction objects with multiple keys', () => {
    const multiLocation: TMultiLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([{ Parachain: 1, AccountId32: { id: '0x123' } }])
    expect(hasJunction(multiLocation, 'Parachain', 1)).toBe(false)
  })

  it('returns false when no matching junction is found', () => {
    const multiLocation: TMultiLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([{ AccountId32: { id: '0x123' } }])
    expect(hasJunction(multiLocation, 'Parachain')).toBe(false)
  })

  it('returns false when flattenJunctions returns an empty array', () => {
    const multiLocation: TMultiLocation = { parents: Parents.ZERO, interior: {} }
    vi.mocked(flattenJunctions).mockReturnValue([])
    expect(hasJunction(multiLocation, 'Parachain')).toBe(false)
  })

  it('returns true when a matching junction exists and JSON.stringify fails', () => {
    const multiLocation: TMultiLocation = {
      parents: Parents.ZERO,
      interior: {
        X1: [{ Parachain: 1000n }]
      }
    }
    vi.mocked(flattenJunctions).mockReturnValue([{ Parachain: 1000n }])
    expect(hasJunction(multiLocation, 'Parachain', 1000n)).toBe(true)
  })
})
