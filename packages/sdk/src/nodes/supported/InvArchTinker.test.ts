import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type InvArchTinker from './InvArchTinker'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('InvArchTinker', () => {
  let invArchTinker: InvArchTinker<ApiPromise, Extrinsic>
  const mockInput = {
    asset: { symbol: 'TNKR', assetId: '123' },
    amount: '100'
  } as XTokensTransferInput<ApiPromise, Extrinsic>

  beforeEach(() => {
    invArchTinker = getNode<ApiPromise, Extrinsic, 'InvArchTinker'>('InvArchTinker')
  })

  it('should initialize with correct values', () => {
    expect(invArchTinker.node).toBe('InvArchTinker')
    expect(invArchTinker.name).toBe('tinker')
    expect(invArchTinker.type).toBe('kusama')
    expect(invArchTinker.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    invArchTinker.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, BigInt(123))
  })
})
