import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Version, XTokensTransferInput } from '../../types'
import XTokensTransferImpl from '../xTokens'
import { getNode } from '../../utils/getNode'
import Unique from './Unique'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Unique', () => {
  let unique: Unique
  const mockInput = {
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    unique = getNode('Unique')
  })

  it('should initialize with correct values', () => {
    expect(unique.node).toBe('Unique')
    expect(unique.name).toBe('unique')
    expect(unique.type).toBe('polkadot')
    expect(unique.version).toBe(Version.V3)
  })

  it('should call transferXTokens with ForeignAssetId', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    unique.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { ForeignAssetId: '123' })
  })
})
