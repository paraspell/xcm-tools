import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Version, XTokensTransferInput } from '../../types'
import XTokensTransferImpl from '../xTokens'
import Picasso from './Picasso'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Picasso', () => {
  let picasso: Picasso
  const mockInput = {
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    picasso = getNode('Picasso')
  })

  it('should initialize with correct values', () => {
    expect(picasso.node).toBe('Picasso')
    expect(picasso.name).toBe('picasso')
    expect(picasso.type).toBe('kusama')
    expect(picasso.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    picasso.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, '123')
  })
})
