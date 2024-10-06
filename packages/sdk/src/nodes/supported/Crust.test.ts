import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import type { XTokensTransferInput, TReserveAsset } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Crust from './Crust'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Crust', () => {
  let crust: Crust
  const mockInput = {
    currency: 'CRU',
    currencyID: '456',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    crust = getNode('Crust')
  })

  it('should initialize with correct values', () => {
    expect(crust.node).toBe('Crust')
    expect(crust.name).toBe('crustParachain')
    expect(crust.type).toBe('polkadot')
    expect(crust.version).toBe(Version.V3)
  })

  it('should call transferXTokens with SelfReserve when currency matches native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(crust, 'getNativeAssetSymbol').mockReturnValue('CRU')

    crust.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'SelfReserve' as TReserveAsset)
  })

  it('should call transferXTokens with OtherReserve when currencyID is defined and currency does not match native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(crust, 'getNativeAssetSymbol').mockReturnValue('NOT_CRU')

    crust.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { OtherReserve: '456' } as TReserveAsset)
  })

  it('should throw InvalidCurrencyError when currencyID is undefined and currency does not match native asset', () => {
    const invalidInput = { ...mockInput, currencyID: undefined }
    vi.spyOn(crust, 'getNativeAssetSymbol').mockReturnValue('NOT_CRU')

    expect(() => crust.transferXTokens(invalidInput)).toThrowError(
      new InvalidCurrencyError('Asset CRU is not supported by node Crust.')
    )
  })
})
