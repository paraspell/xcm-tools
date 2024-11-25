import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TXTokensTransferOptions } from '../../types'
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
    asset: { symbol: 'PIC', assetId: '123' },
    amount: '100'
  } as TXTokensTransferOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    picasso = getNode<ApiPromise, Extrinsic, 'Picasso'>('Picasso')
  })

  it('should initialize with correct values', () => {
    expect(picasso.node).toBe('Picasso')
    expect(picasso.info).toBe('picasso')
    expect(picasso.type).toBe('kusama')
    expect(picasso.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    picasso.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, BigInt(123))
  })
})
