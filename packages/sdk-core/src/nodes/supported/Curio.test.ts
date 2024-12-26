import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TXTokensTransferOptions, TForeignOrTokenAsset } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Curio from './Curio'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
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
        amount: '100'
      }
    }

    curio.transferXTokens(inputWithoutCurrencyID)

    expect(spy).toHaveBeenCalledWith(inputWithoutCurrencyID, {
      Token: 'CUR'
    } as TForeignOrTokenAsset)
  })
})
