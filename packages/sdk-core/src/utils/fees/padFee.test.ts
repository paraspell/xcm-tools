import { describe, expect, it, vi } from 'vitest'

vi.mock('@paraspell/sdk-common', () => ({
  isRelayChain: (c: string) => c === 'Polkadot' || c === 'Kusama'
}))

import { padFee, padValueBy } from './padFee'

const RAW = 1000n

describe('padFee', () => {
  it('multiplies x40 for system-para → para', () => {
    const fee = padFee(RAW, 'AssetHubPolkadot', 'Hydration', 'origin')
    expect(fee).toBe(40_000n)
  })

  it('multiplies x3 for relay → para (origin side)', () => {
    const fee = padFee(RAW, 'Polkadot', 'Hydration', 'origin')
    expect(fee).toBe(3_200n)
  })

  it('multiplies x30 for relay → para (destination side)', () => {
    const fee = padFee(RAW, 'Polkadot', 'Hydration', 'destination')
    expect(fee).toBe(30_000n)
  })

  it('adds 30 % for para → para', () => {
    const fee = padFee(RAW, 'Hydration', 'BifrostPolkadot', 'origin')
    expect(fee).toBe(1_300n)
  })

  it('applies default 30 % when no rule matches (relay → relay)', () => {
    const fee = padFee(RAW, 'Polkadot', 'Kusama', 'origin')
    expect(fee).toBe(1_300n)
  })

  it('returns hardcoded value for Mythos → non-Ethereum (origin side)', () => {
    const fee = padFee(RAW, 'Mythos', 'Hydration', 'origin')
    expect(fee).toBe(150000000000000000n)
  })
})

describe('padFeeBy', () => {
  it('should return the same amount if percent is 0', () => {
    const result = padValueBy(1000n, 0)
    expect(result).toBe(1000n)
  })

  it('should pad the fee by 10%', () => {
    const result = padValueBy(1000n, 10)
    // 1000 * (100 + 10) / 100 = 1100
    expect(result).toBe(1100n)
  })

  it('should pad the fee by 50%', () => {
    const result = padValueBy(200n, 50)
    // 200 * 150 / 100 = 300
    expect(result).toBe(300n)
  })

  it('should pad the fee by 100% (double)', () => {
    const result = padValueBy(1234n, 100)
    // 1234 * 200 / 100 = 2468
    expect(result).toBe(2468n)
  })

  it('should return 0 if amount is 0 regardless of percent', () => {
    expect(padValueBy(0n, 100)).toBe(0n)
    expect(padValueBy(0n, 0)).toBe(0n)
    expect(padValueBy(0n, 999)).toBe(0n)
  })
})
