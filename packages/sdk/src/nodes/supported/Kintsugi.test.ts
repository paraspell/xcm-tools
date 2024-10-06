import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput, TForeignOrTokenAsset } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Kintsugi from './Kintsugi'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Kintsugi', () => {
  let kintsugi: Kintsugi
  const mockInput = {
    currency: 'KINT',
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    kintsugi = getNode('Kintsugi')
  })

  it('should initialize with correct values', () => {
    expect(kintsugi.node).toBe('Kintsugi')
    expect(kintsugi.name).toBe('kintsugi')
    expect(kintsugi.type).toBe('kusama')
    expect(kintsugi.version).toBe(Version.V3)
  })

  it('should call transferXTokens with ForeignAsset when currencyID is defined', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    kintsugi.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { ForeignAsset: '123' } as TForeignOrTokenAsset)
  })

  it('should call transferXTokens with Token when currencyID is undefined', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    const inputWithoutCurrencyID = { ...mockInput, currencyID: undefined }

    kintsugi.transferXTokens(inputWithoutCurrencyID)

    expect(spy).toHaveBeenCalledWith(inputWithoutCurrencyID, {
      Token: 'KINT'
    } as TForeignOrTokenAsset)
  })
})
