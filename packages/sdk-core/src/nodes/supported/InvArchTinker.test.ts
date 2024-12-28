import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../../pallets/xTokens'
import type InvArchTinker from './InvArchTinker'
import { getNode } from '../../utils'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('InvArchTinker', () => {
  let invArchTinker: InvArchTinker<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'TNKR', assetId: '123', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    invArchTinker = getNode<unknown, unknown, 'InvArchTinker'>('InvArchTinker')
  })

  it('should initialize with correct values', () => {
    expect(invArchTinker.node).toBe('InvArchTinker')
    expect(invArchTinker.info).toBe('tinker')
    expect(invArchTinker.type).toBe('kusama')
    expect(invArchTinker.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    invArchTinker.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, BigInt(123))
  })
})
