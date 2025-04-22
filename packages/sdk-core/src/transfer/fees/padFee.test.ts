import { describe, expect, it, vi } from 'vitest'

vi.mock('@paraspell/sdk-common', () => ({
  isRelayChain: (c: string) => c === 'Polkadot' || c === 'Kusama'
}))

import { padFee } from './padFee'

const RAW = 1000n

describe('padFee', () => {
  it('multiplies ×40 for system-para → para', () => {
    const fee = padFee(RAW, 'AssetHubPolkadot', 'Hydration', 'origin')
    expect(fee).toBe(40_000n)
  })

  it('multiplies ×3 for relay → para (origin side)', () => {
    const fee = padFee(RAW, 'Polkadot', 'Hydration', 'origin')
    expect(fee).toBe(3_200n)
  })

  it('multiplies ×30 for relay → para (destination side)', () => {
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
})
