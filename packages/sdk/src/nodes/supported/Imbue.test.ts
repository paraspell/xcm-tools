import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Imbue from './Imbue'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Imbue', () => {
  let imbue: Imbue
  const mockInput = {
    currency: 'IMBU',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    imbue = getNode('Imbue')
  })

  it('should initialize with correct values', () => {
    expect(imbue.node).toBe('Imbue')
    expect(imbue.name).toBe('imbue')
    expect(imbue.type).toBe('kusama')
    expect(imbue.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currency', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    imbue.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'IMBU')
  })
})
