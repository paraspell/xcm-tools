import { describe, expect, it } from 'vitest'

import { shuffleArray } from './shuffleArray'

describe('shuffleArray', () => {
  it('returns a new array reference', () => {
    const arr = [1, 2, 3, 4]
    const result = shuffleArray(arr)
    expect(result).not.toBe(arr)
  })

  it('returns an array with the same elements, ignoring order', () => {
    const arr = [1, 2, 3, 4, 5]
    const result = shuffleArray(arr)
    expect(result.sort()).toEqual(arr.sort())
    expect(result).toHaveLength(arr.length)
  })

  it('returns a different array reference when input is empty', () => {
    const arr: number[] = []
    const result = shuffleArray(arr)
    expect(result).not.toBe(arr)
    expect(result).toHaveLength(0)
  })

  it('returns a different array reference when input has one element', () => {
    const arr = [42]
    const result = shuffleArray(arr)
    expect(result).not.toBe(arr)
    expect(result).toEqual(arr)
  })

  it('handles multiple shuffles consistently', () => {
    const arr = [1, 2, 3, 4, 5, 6]
    const firstShuffle = shuffleArray(arr)
    const secondShuffle = shuffleArray(arr)
    expect(firstShuffle.sort()).toEqual(arr.sort())
    expect(secondShuffle.sort()).toEqual(arr.sort())
  })
})
