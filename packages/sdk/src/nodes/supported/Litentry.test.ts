import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Version, XTokensTransferInput, TSelfReserveAsset } from '../../types'
import XTokensTransferImpl from '../xTokens'
import Litentry from './Litentry'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Litentry', () => {
  let litentry: Litentry
  const mockInput = {
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    litentry = getNode('Litentry')
  })

  it('should initialize with correct values', () => {
    expect(litentry.node).toBe('Litentry')
    expect(litentry.name).toBe('litentry')
    expect(litentry.type).toBe('polkadot')
    expect(litentry.version).toBe(Version.V3)
  })

  it('should call transferXTokens with SelfReserve', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    litentry.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'SelfReserve' as TSelfReserveAsset)
  })
})
