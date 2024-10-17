import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput, TSelfReserveAsset } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Litentry from './Litentry'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Litentry', () => {
  let litentry: Litentry<ApiPromise, Extrinsic>
  const mockInput = {
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput<ApiPromise, Extrinsic>

  beforeEach(() => {
    litentry = getNode<ApiPromise, Extrinsic, 'Litentry'>('Litentry')
  })

  it('should initialize with correct values', () => {
    expect(litentry.node).toBe('Litentry')
    expect(litentry.name).toBe('litentry')
    expect(litentry.type).toBe('polkadot')
    expect(litentry.version).toBe(Version.V3)
  })

  it('should call transferXTokens with SelfReserve', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    litentry.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'SelfReserve' as TSelfReserveAsset)
  })
})
