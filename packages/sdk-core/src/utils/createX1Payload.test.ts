import { type TJunction, Version } from '@paraspell/sdk-common'
import { describe, expect, it } from 'vitest'

import { createX1Payload } from './createX1Payload'

describe('createX1Payload', () => {
  it('should return an X1 payload with a single junction when version is V3', () => {
    const junction: TJunction = { AccountId32: { id: '0x123', network: null } }
    const result = createX1Payload(Version.V3, junction)
    expect(result).toEqual({ X1: junction })
  })

  it('should return an X1 payload with an array of junction when version is V4', () => {
    const junction: TJunction = { Parachain: 2000 }
    const result = createX1Payload(Version.V4, junction)
    expect(result).toEqual({ X1: [junction] })
  })

  it('should return an X1 payload with an array of junction when version is V5', () => {
    const junction: TJunction = { Parachain: 2000 }
    const result = createX1Payload(Version.V5, junction)
    expect(result).toEqual({ X1: [junction] })
  })
})
