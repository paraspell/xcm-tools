import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InvalidCurrencyError } from '../../errors'
import type { XTransferTransferInput } from '../../types'
import { Version } from '../../types'
import XTransferTransferImpl from '../xTransfer'
import type Khala from './Khala'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTransfer', () => ({
  default: {
    transferXTransfer: vi.fn()
  }
}))

describe('Khala', () => {
  let khala: Khala<ApiPromise, Extrinsic>
  const mockInput = {
    asset: { symbol: 'PHA' },
    amount: '100'
  } as XTransferTransferInput<ApiPromise, Extrinsic>

  beforeEach(() => {
    khala = getNode<ApiPromise, Extrinsic, 'Khala'>('Khala')
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
    const invalidInput = { ...mockInput, asset: { symbol: 'INVALID' } }

    expect(() => khala.transferXTransfer(invalidInput)).toThrowError(InvalidCurrencyError)
  })
})
