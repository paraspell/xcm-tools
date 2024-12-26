import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InvalidCurrencyError } from '../../errors'
import type { TXTransferTransferOptions } from '../../types'
import { Version } from '../../types'
import XTransferTransferImpl from '../xTransfer'
import type Khala from './Khala'
import { getNode } from '../../utils'

vi.mock('../xTransfer', () => ({
  default: {
    transferXTransfer: vi.fn()
  }
}))

describe('Khala', () => {
  let khala: Khala<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'PHA', amount: '100' }
  } as TXTransferTransferOptions<unknown, unknown>

  beforeEach(() => {
    khala = getNode<unknown, unknown, 'Khala'>('Khala')
  })

  it('should initialize with correct values', () => {
    expect(khala.node).toBe('Khala')
    expect(khala.info).toBe('khala')
    expect(khala.type).toBe('kusama')
    expect(khala.version).toBe(Version.V3)
  })

  it('should call transferXTransfer with valid currency PHA', () => {
    const spy = vi.spyOn(XTransferTransferImpl, 'transferXTransfer')

    khala.transferXTransfer(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput)
  })

  it('should throw InvalidCurrencyError for unsupported currency', () => {
    const invalidInput = { ...mockInput, asset: { symbol: 'INVALID', amount: '100' } }

    expect(() => khala.transferXTransfer(invalidInput)).toThrowError(InvalidCurrencyError)
  })
})
