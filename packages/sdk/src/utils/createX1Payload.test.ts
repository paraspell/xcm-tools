import { describe, it, expect } from 'vitest'
import { Version, TJunction } from '../types'
import { createX1Payload } from './createX1Payload'

describe('createX1Payload', () => {
  it('should return an X1 payload with an array of junction when version is V4', () => {
    const junction: TJunction = { Parachain: 2000 }
    const result = createX1Payload(Version.V4, junction)
    expect(result).toEqual({ X1: [junction] })
  })

  it('should return an X1 payload with a single junction when version is not V4', () => {
    const junction: TJunction = { AccountId32: { id: '0x123', network: null } }
    const result = createX1Payload('V3' as Version, junction)
    expect(result).toEqual({ X1: junction })
  })
})
