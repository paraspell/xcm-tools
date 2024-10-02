import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Version, XTokensTransferInput } from '../../types'
import XTokensTransferImpl from '../xTokens'
import ComposableFinance from './ComposableFinance'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('ComposableFinance', () => {
  let composableFinance: ComposableFinance
  const mockInput = {
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    composableFinance = getNode('ComposableFinance')
  })

  it('should initialize with correct values', () => {
    expect(composableFinance.node).toBe('ComposableFinance')
    expect(composableFinance.name).toBe('composable')
    expect(composableFinance.type).toBe('polkadot')
    expect(composableFinance.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    composableFinance.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, '123')
  })
})
