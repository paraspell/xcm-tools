import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput, TForeignOrTokenAsset } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Interlay from './Interlay'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Interlay', () => {
  let interlay: Interlay<ApiPromise, Extrinsic>
  const mockInput = {
    currency: 'INTR',
    currencyID: '456',
    amount: '100'
  } as XTokensTransferInput<ApiPromise, Extrinsic>

  beforeEach(() => {
    interlay = getNode<ApiPromise, Extrinsic, 'Interlay'>('Interlay')
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

    expect(spy).toHaveBeenCalledWith(mockInput, { ForeignAsset: 456 } as TForeignOrTokenAsset)
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