import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import { getNode } from '../../utils/getNode'
import type Acala from './Acala'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

vi.mock('../config', () => ({
  getNodeProviders: vi.fn()
}))

describe('Acala', () => {
  let acala: Acala<ApiPromise, Extrinsic>
  const mockInput = {
    asset: { symbol: 'ACA', amount: '100' }
  } as TXTokensTransferOptions<ApiPromise, Extrinsic>
  const spyTransferXTokens = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

  beforeEach(() => {
    acala = getNode<ApiPromise, Extrinsic, 'Acala'>('Acala')
    spyTransferXTokens.mockClear()
  })

  it('should initialize with correct values', () => {
    expect(acala.node).toBe('Acala')
    expect(acala.info).toBe('acala')
    expect(acala.type).toBe('polkadot')
    expect(acala.version).toBe(Version.V3)
  })

  it('should call transferXTokens with Token when currencyID is undefined', () => {
    acala.transferXTokens(mockInput)

    expect(spyTransferXTokens).toHaveBeenCalledWith(mockInput, { Token: 'ACA' })
  })

  it('should call transferXTokens with ForeignAsset when currencyID is defined', () => {
    const inputWithCurrencyID = {
      ...mockInput,
      asset: {
        symbol: 'ACA',
        assetId: 1,
        amount: '100'
      }
    }

    acala.transferXTokens(inputWithCurrencyID)

    expect(spyTransferXTokens).toHaveBeenCalledWith(inputWithCurrencyID, {
      ForeignAsset: 1
    })
  })
})
