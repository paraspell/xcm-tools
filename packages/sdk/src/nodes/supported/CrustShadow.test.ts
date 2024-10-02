import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import { Version, XTokensTransferInput, TReserveAsset } from '../../types'
import XTokensTransferImpl from '../xTokens'
import CrustShadow from './CrustShadow'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('CrustShadow', () => {
  let crustShadow: CrustShadow
  const mockInput = {
    currency: 'CRU',
    currencyID: '456',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    crustShadow = getNode('CrustShadow')
  })

  it('should initialize with correct values', () => {
    expect(crustShadow.node).toBe('CrustShadow')
    expect(crustShadow.name).toBe('shadow')
    expect(crustShadow.type).toBe('kusama')
    expect(crustShadow.version).toBe(Version.V3)
  })

  it('should call transferXTokens with SelfReserve when currency matches native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(crustShadow, 'getNativeAssetSymbol').mockReturnValue('CRU')

    crustShadow.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'SelfReserve' as TReserveAsset)
  })

  it('should call transferXTokens with OtherReserve when currencyID is defined and currency does not match native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(crustShadow, 'getNativeAssetSymbol').mockReturnValue('NOT_CRU')

    crustShadow.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { OtherReserve: '456' } as TReserveAsset)
  })

  it('should throw InvalidCurrencyError when currencyID is undefined and currency does not match native asset', () => {
    const invalidInput = { ...mockInput, currencyID: undefined }
    vi.spyOn(crustShadow, 'getNativeAssetSymbol').mockReturnValue('NOT_CRU')

    expect(() => crustShadow.transferXTokens(invalidInput)).toThrowError(
      new InvalidCurrencyError('Asset CRU is not supported by node CrustShadow.')
    )
  })
})
