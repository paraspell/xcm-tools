import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Version, XTokensTransferInput } from '../../types'
import XTokensTransferImpl from '../xTokens'
import Pioneer from './Pioneer'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Pioneer', () => {
  let pioneer: Pioneer
  const mockInput = {
    currencyID: '123',
    amount: '100',
    fees: 0.01
  } as XTokensTransferInput

  beforeEach(() => {
    pioneer = getNode('Pioneer')
  })

  it('should initialize with correct values', () => {
    expect(pioneer.node).toBe('Pioneer')
    expect(pioneer.name).toBe('pioneer')
    expect(pioneer.type).toBe('kusama')
    expect(pioneer.version).toBe(Version.V1)
  })

  it('should call transferXTokens with NativeToken and fees', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    pioneer.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'NativeToken', 0.01)
  })
})
