import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import { getNode } from '../../utils/getNode'
import type Zeitgeist from './Zeitgeist'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Zeitgeist', () => {
  let zeitgeist: Zeitgeist
  const mockInput = {
    currency: 'ZTG',
    amount: '100',
    currencyID: '123'
  } as XTokensTransferInput

  beforeEach(() => {
    zeitgeist = getNode('Zeitgeist')
  })

  it('should initialize with correct values', () => {
    expect(zeitgeist.node).toBe('Zeitgeist')
    expect(zeitgeist.name).toBe('zeitgeist')
    expect(zeitgeist.type).toBe('polkadot')
    expect(zeitgeist.version).toBe(Version.V3)
  })

  it('should call transferXTokens with native asset "Ztg" when currency matches native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(zeitgeist, 'getNativeAssetSymbol').mockReturnValue('ZTG')

    zeitgeist.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'Ztg')
  })

  it('should call transferXTokens with ForeignAsset when currency does not match the native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(zeitgeist, 'getNativeAssetSymbol').mockReturnValue('NOT_ZTG')

    zeitgeist.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, {
      ForeignAsset: '123'
    })
  })
})
