import { describe, expect, it } from 'vitest'

import { blake2128Concat, toLeHex } from './storage'

describe('blake2128Concat', () => {
  it('prepends the blake2-128 hash to the hex data', () => {
    const accountId = 'd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d'
    expect(blake2128Concat(accountId)).toBe('de1e86a9a8c739864cf3cc5ec2bea59f' + accountId)
  })
})

describe('toLeHex', () => {
  it('encodes the value as little-endian hex of the given byte size', () => {
    expect(toLeHex(1500n, 16)).toBe('dc050000000000000000000000000000')
    expect(toLeHex(437, 4)).toBe('b5010000')
  })
})
