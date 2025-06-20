import { describe, expect, it } from 'vitest'

import type { TJunction, TJunctions } from '../../types'
import { flattenJunctions } from './flattenJunctions'

describe('flattenJunctions', () => {
  it("returns an empty array if 'Here' is defined", () => {
    const input: TJunctions = { Here: null }
    const result = flattenJunctions(input)
    expect(result).toEqual([])
  })

  it("returns an empty array when no 'Xn' fields are present", () => {
    const input: TJunctions = {}
    const result = flattenJunctions(input)
    expect(result).toEqual([])
  })

  const sampleJunctions: TJunction[] = [
    { Parachain: 3000 },
    { AccountId32: { network: null, id: '0x1234' } },
    { AccountIndex64: { network: null, index: '0x1234' } },
    { AccountKey20: { key: '0x1234' } },
    { PalletInstance: 1000 },
    { GeneralIndex: 1000 },
    { GeneralKey: { length: 1000, data: '0x1234' } },
    { OnlyChild: '123' }
  ]

  for (let i = 1; i <= 8; i++) {
    it(`flattens an array of objects in X${i}`, () => {
      const key = `X${i}` as keyof TJunctions
      const input: TJunctions = {
        [key]: sampleJunctions.slice(0, i)
      }
      const result = flattenJunctions(input)
      expect(result).toEqual(sampleJunctions.slice(0, i))
    })

    if (i === 1) {
      it(`flattens an object X1`, () => {
        const input: TJunctions = {
          X1: sampleJunctions[0]
        }
        const result = flattenJunctions(input)
        expect(result).toEqual([sampleJunctions[0]])
      })
    }
  }
})
