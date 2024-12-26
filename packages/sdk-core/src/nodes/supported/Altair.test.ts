import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import { getNode } from '../../utils/getNode'
import type Altair from './Altair'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Altair', () => {
  let altair: Altair<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'AIR', assetId: '1', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    altair = getNode<unknown, unknown, 'Altair'>('Altair')
  })

  it('should initialize with correct values', () => {
    expect(altair.node).toBe('Altair')
    expect(altair.info).toBe('altair')
    expect(altair.type).toBe('kusama')
    expect(altair.version).toBe(Version.V3)
  })

  it('should call transferXTokens with Native when currency matches the native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(altair, 'getNativeAssetSymbol').mockReturnValue('AIR')

    altair.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'Native')
  })

  it('should call transferXTokens with ForeignAsset when currency does not match the native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    const inputWithCurrencyID = { ...mockInput, currencyID: '1' }
    vi.spyOn(altair, 'getNativeAssetSymbol').mockReturnValue('NOT_AIR')

    altair.transferXTokens(inputWithCurrencyID)

    expect(spy).toHaveBeenCalledWith(inputWithCurrencyID, {
      ForeignAsset: 1
    })
  })
})
