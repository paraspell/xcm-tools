import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Version, XTokensTransferInput } from '../../types'
import XTokensTransferImpl from '../xTokens'
import Polkadex from './Polkadex'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Polkadex', () => {
  let polkadex: Polkadex
  const mockInput = {
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    polkadex = getNode('Polkadex')
  })

  it('should initialize with correct values', () => {
    expect(polkadex.node).toBe('Polkadex')
    expect(polkadex.name).toBe('polkadex')
    expect(polkadex.type).toBe('polkadot')
    expect(polkadex.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    polkadex.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, '123')
  })
})
