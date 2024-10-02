import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InvalidCurrencyError } from '../../errors'
import { Version, XTransferTransferInput } from '../../types'
import XTransferTransferImpl from '../xTransfer'
import Phala from './Phala'
import { getNode } from '../../utils'

vi.mock('../xTransfer', () => ({
  default: {
    transferXTransfer: vi.fn()
  }
}))

describe('Phala', () => {
  let phala: Phala
  const mockInput = {
    currency: 'PHA',
    amount: '100'
  } as XTransferTransferInput

  beforeEach(() => {
    phala = getNode('Phala')
  })

  it('should initialize with correct values', () => {
    expect(phala.node).toBe('Phala')
    expect(phala.name).toBe('phala')
    expect(phala.type).toBe('polkadot')
    expect(phala.version).toBe(Version.V3)
  })

  it('should call transferXTransfer with valid currency', () => {
    const spy = vi.spyOn(XTransferTransferImpl, 'transferXTransfer')
    vi.spyOn(phala, 'getNativeAssetSymbol').mockReturnValue('PHA')

    phala.transferXTransfer(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput)
  })

  it('should throw InvalidCurrencyError for unsupported currency', () => {
    vi.spyOn(phala, 'getNativeAssetSymbol').mockReturnValue('NOT_PHA')

    expect(() => phala.transferXTransfer(mockInput)).toThrowError(
      new InvalidCurrencyError(`Node Phala does not support currency PHA`)
    )
  })
})
