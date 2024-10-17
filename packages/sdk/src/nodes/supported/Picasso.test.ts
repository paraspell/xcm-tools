import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Picasso from './Picasso'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Picasso', () => {
  let picasso: Picasso<ApiPromise, Extrinsic>
  const mockInput = {
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput<ApiPromise, Extrinsic>

  beforeEach(() => {
    picasso = getNode<ApiPromise, Extrinsic, 'Picasso'>('Picasso')
  })

  it('should initialize with correct values', () => {
    expect(picasso.node).toBe('Picasso')
    expect(picasso.name).toBe('picasso')
    expect(picasso.type).toBe('kusama')
    expect(picasso.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    picasso.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, '123')
  })
})
