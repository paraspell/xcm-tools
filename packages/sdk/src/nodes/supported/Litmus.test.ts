import { describe, it, expect, beforeEach } from 'vitest'
import { getNode } from '../../utils'
import Litmus from './Litmus'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

describe('Litmus', () => {
  let litmus: Litmus<ApiPromise, Extrinsic>

  beforeEach(() => {
    litmus = getNode<ApiPromise, Extrinsic, 'Litmus'>('Litmus')
  })

  it('should be instantiated correctly', () => {
    expect(litmus).toBeInstanceOf(Litmus)
  })

  describe('getProvider', () => {
    it('should return the correct provider URL', () => {
      const provider = litmus.getProvider()
      expect(provider).toBe('wss:///rpc.litmus-parachain.litentry.io')
    })
  })
})
