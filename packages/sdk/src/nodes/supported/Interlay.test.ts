import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Version, XTokensTransferInput, TForeignOrTokenAsset } from '../../types'
import XTokensTransferImpl from '../xTokens'
import Interlay from './Interlay'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Interlay', () => {
  let interlay: Interlay
  const mockInput = {
    currency: 'INTR',
    currencyID: '456',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    interlay = getNode('Interlay')
  })

  it('should initialize with correct values', () => {
    expect(interlay.node).toBe('Interlay')
    expect(interlay.name).toBe('interlay')
    expect(interlay.type).toBe('polkadot')
    expect(interlay.version).toBe(Version.V3)
  })

  it('should call transferXTokens with ForeignAsset when currencyID is defined', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    interlay.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { ForeignAsset: '456' } as TForeignOrTokenAsset)
  })

  it('should call transferXTokens with Token when currencyID is undefined', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    const inputWithoutCurrencyID = { ...mockInput, currencyID: undefined }

    interlay.transferXTokens(inputWithoutCurrencyID)

    expect(spy).toHaveBeenCalledWith(inputWithoutCurrencyID, {
      Token: 'INTR'
    } as TForeignOrTokenAsset)
  })
})
