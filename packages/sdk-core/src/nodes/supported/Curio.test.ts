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
import type Curio from './Curio'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Curio', () => {
  let curio: Curio<unknown, unknown>
  const mockInput = {
    asset: {
      symbol: 'CUR',
      assetId: '123',
      amount: '100'
    }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    curio = getNode<unknown, unknown, 'Curio'>('Curio')
  })

  it('should initialize with correct values', () => {
    expect(curio.node).toBe('Curio')
    expect(curio.info).toBe('curio')
    expect(curio.type).toBe('kusama')
    expect(curio.version).toBe(Version.V3)
  })

  it('should call transferXTokens with ForeignAsset when currencyID is defined', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    curio.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { ForeignAsset: 123 } as TForeignOrTokenAsset)
  })

  it('should call transferXTokens with Token when currencyID is undefined', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    const inputWithoutCurrencyID = {
      ...mockInput,
      asset: {
        symbol: 'CUR',
        amount: '100',
        isNative: true
      } as WithAmount<TNativeAsset>
    }

    curio.transferXTokens(inputWithoutCurrencyID)

    expect(spy).toHaveBeenCalledWith(inputWithoutCurrencyID, {
      Token: 'CUR'
    } as TForeignOrTokenAsset)
  })
})
