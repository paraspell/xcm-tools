import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Pioneer from './Pioneer'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Pioneer', () => {
  let pioneer: Pioneer<ApiPromise, Extrinsic>
  const mockInput = {
    asset: { assetId: '123' },
    amount: '100',
    fees: 0.01
  } as TXTokensTransferOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    pioneer = getNode<ApiPromise, Extrinsic, 'Pioneer'>('Pioneer')
  })

  it('should initialize with correct values', () => {
    expect(pioneer.node).toBe('Pioneer')
    expect(pioneer.info).toBe('pioneer')
    expect(pioneer.type).toBe('kusama')
    expect(pioneer.version).toBe(Version.V1)
  })

  it('should call transferXTokens with NativeToken and fees', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    pioneer.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'NativeToken', 0.01)
  })
})
