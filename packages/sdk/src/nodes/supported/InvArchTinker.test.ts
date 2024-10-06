import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type InvArchTinker from './InvArchTinker'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('InvArchTinker', () => {
  let invArchTinker: InvArchTinker
  const mockInput = {
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    invArchTinker = getNode('InvArchTinker')
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

    expect(spy).toHaveBeenCalledWith(mockInput, '123')
  })
})
