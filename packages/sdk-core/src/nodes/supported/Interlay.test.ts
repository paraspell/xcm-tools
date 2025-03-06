import { beforeEach, describe, expect, it, vi } from 'vitest'

import XTokensTransferImpl from '../../pallets/xTokens'
import type {
  TForeignOrTokenAsset,
  TNativeAsset,
  TXTokensTransferOptions,
  WithAmount
} from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type Interlay from './Interlay'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Interlay', () => {
  let interlay: Interlay<unknown, unknown>
  const mockInput = {
    asset: {
      symbol: 'INTR',
      assetId: '456',
      amount: '100'
    }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    interlay = getNode<unknown, unknown, 'Interlay'>('Interlay')
  })

  it('should initialize with correct values', () => {
    expect(interlay.node).toBe('Interlay')
    expect(interlay.info).toBe('interlay')
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
    const inputWithoutCurrencyID = {
      ...mockInput,
      asset: {
        symbol: 'INTR',
        amount: '100',
        isNative: true
      } as WithAmount<TNativeAsset>
    }

    interlay.transferXTokens(inputWithoutCurrencyID)

    expect(spy).toHaveBeenCalledWith(inputWithoutCurrencyID, {
      Token: 'INTR'
    } as TForeignOrTokenAsset)
  })
})
