import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput, TForeignOrTokenAsset } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Curio from './Curio'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Curio', () => {
  let curio: Curio<ApiPromise, Extrinsic>
  const mockInput = {
    currency: 'CUR',
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput<ApiPromise, Extrinsic>

  beforeEach(() => {
    curio = getNode<ApiPromise, Extrinsic, 'Curio'>('Curio')
  })

  it('should initialize with correct values', () => {
    expect(curio.node).toBe('Curio')
    expect(curio.name).toBe('curio')
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
    const inputWithoutCurrencyID = { ...mockInput, currencyID: undefined }

    curio.transferXTokens(inputWithoutCurrencyID)

    expect(spy).toHaveBeenCalledWith(inputWithoutCurrencyID, {
      Token: 'CUR'
    } as TForeignOrTokenAsset)
  })
})
