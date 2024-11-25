import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Parallel from './Parallel'
import { getNode } from '../../utils/getNode'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Parallel', () => {
  let parallel: Parallel<ApiPromise, Extrinsic>
  const mockInput = {
    asset: { symbol: 'PARA', assetId: '123' },
    amount: '100'
  } as TXTokensTransferOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    parallel = getNode<ApiPromise, Extrinsic, 'Parallel'>('Parallel')
  })

  it('should initialize with correct values', () => {
    expect(parallel.node).toBe('Parallel')
    expect(parallel.info).toBe('parallel')
    expect(parallel.type).toBe('polkadot')
    expect(parallel.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    parallel.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, BigInt(123))
  })
})
