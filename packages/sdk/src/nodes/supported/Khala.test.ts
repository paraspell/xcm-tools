import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InvalidCurrencyError } from '../../errors'
import type { XTransferTransferInput } from '../../types'
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
  let khala: Khala
  const mockInput = {
    currency: 'PHA',
    amount: '100'
  } as XTransferTransferInput

  beforeEach(() => {
    khala = getNode('Khala')
  })

  it('should initialize with correct values', () => {
    expect(khala.node).toBe('Khala')
    expect(khala.name).toBe('khala')
    expect(khala.type).toBe('kusama')
    expect(khala.version).toBe(Version.V3)
  })

  it('should call transferXTransfer with valid currency PHA', () => {
    const spy = vi.spyOn(XTransferTransferImpl, 'transferXTransfer')

    khala.transferXTransfer(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput)
  })

  it('should throw InvalidCurrencyError for unsupported currency', () => {
    const invalidInput = { ...mockInput, currency: 'INVALID' }

    expect(() => khala.transferXTransfer(invalidInput)).toThrowError(
      new InvalidCurrencyError(`Node Khala does not support currency INVALID`)
    )
  })
})
