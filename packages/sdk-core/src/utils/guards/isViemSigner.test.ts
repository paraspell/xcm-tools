import { describe, expect, it } from 'vitest'

import { isViemSigner } from './isViemSigner'

describe('isViemSigner', () => {
  it('returns true for an object shaped like a viem WalletClient', () => {
    const client = {
      account: { address: '0x0000000000000000000000000000000000000000' },
      sendTransaction: () => Promise.resolve('0x')
    }
    expect(isViemSigner(client)).toBe(true)
  })

  it('returns false for a string (address)', () => {
    expect(isViemSigner('0x0000000000000000000000000000000000000000')).toBe(false)
  })

  it('returns false for null and undefined', () => {
    expect(isViemSigner(null)).toBe(false)
    expect(isViemSigner(undefined)).toBe(false)
  })

  it('returns false for a substrate signer shape', () => {
    const substrateSigner = { signBytes: () => {}, signTx: () => {} }
    expect(isViemSigner(substrateSigner)).toBe(false)
  })

  it('returns false when either marker property is missing', () => {
    expect(isViemSigner({ account: {} })).toBe(false)
    expect(isViemSigner({ sendTransaction: () => {} })).toBe(false)
  })
})
