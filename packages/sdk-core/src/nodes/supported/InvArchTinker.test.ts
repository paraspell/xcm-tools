import { beforeEach, describe, expect, it, vi } from 'vitest'

import XTokensTransferImpl from '../../pallets/xTokens'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type InvArchTinker from './InvArchTinker'

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

    expect(spy).toHaveBeenCalledWith(mockInput, 123n)
  })
})
