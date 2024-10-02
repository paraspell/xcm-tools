import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InvalidCurrencyError, NodeNotSupportedError } from '../../errors'
import { Version, XTokensTransferInput } from '../../types'
import XTokensTransferImpl from '../xTokens'
import Integritee from './Integritee'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Integritee', () => {
  let integritee: Integritee
  const mockInput = {
    currency: 'TEER',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    integritee = getNode('Integritee')
  })

  it('should initialize with correct values', () => {
    expect(integritee.node).toBe('Integritee')
    expect(integritee.name).toBe('integritee')
    expect(integritee.type).toBe('kusama')
    expect(integritee.version).toBe(Version.V3)
  })

  it('should call transferXTokens with valid currency', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    integritee.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'TEER')
  })

  it('should throw InvalidCurrencyError for unsupported currency KSM', () => {
    const invalidInput = { ...mockInput, currency: 'KSM' }

    expect(() => integritee.transferXTokens(invalidInput)).toThrowError(
      new InvalidCurrencyError('Node Integritee does not support currency KSM')
    )
  })

  it('should throw NodeNotSupportedError for transferRelayToPara', () => {
    expect(() => integritee.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })
})
