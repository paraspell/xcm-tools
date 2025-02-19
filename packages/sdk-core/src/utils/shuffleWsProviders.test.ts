import { describe, it, expect } from 'vitest'
import { shuffleWsProviders } from './shuffleWsProviders'

describe('shuffleWsProviders', () => {
  it('returns a shuffled copy if node is "hydration"', () => {
    const providers = ['wss://one', 'wss://two', 'wss://three']
    const result = shuffleWsProviders('Hydration', providers)
    expect(result.sort()).toEqual(providers.sort())
    expect(result).toHaveLength(providers.length)
  })

  it('returns a shuffled copy if node is "Acala"', () => {
    const providers = ['wss://one', 'wss://two', 'wss://three']
    const result = shuffleWsProviders('Acala', providers)
    expect(result.sort()).toEqual(providers.sort())
    expect(result).toHaveLength(providers.length)
  })

  it('returns the same array reference if node is not "hydration"', () => {
    const providers = ['wss://one', 'wss://two', 'wss://three']
    const result = shuffleWsProviders('Altair', providers)
    expect(result).toBe(providers)
  })

  it('handles an empty providers array correctly', () => {
    const emptyProviders: string[] = []
    const result = shuffleWsProviders('Hydration', emptyProviders)
    expect(result).toHaveLength(0)
  })
})
