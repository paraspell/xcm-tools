import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../../pallets/xTokens'
import { getNode } from '../../utils/getNode'
import type Unique from './Unique'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Unique', () => {
  let unique: Unique<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'GLMR', assetId: '123', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    unique = getNode<unknown, unknown, 'Unique'>('Unique')
  })

  it('should initialize with correct values', () => {
    expect(unique.node).toBe('Unique')
    expect(unique.info).toBe('unique')
    expect(unique.type).toBe('polkadot')
    expect(unique.version).toBe(Version.V3)
  })

  it('should call transferXTokens with asset id', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    unique.transferXTokens(mockInput)
    expect(spy).toHaveBeenCalledWith(mockInput, 123)
  })

  it('should call transferXTokens with NativeAssetId', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    const input = {
      asset: {
        ...mockInput.asset,
        symbol: 'UNQ'
      }
    } as TXTokensTransferOptions<unknown, unknown>
    unique.transferXTokens(input)
    expect(spy).toHaveBeenCalledWith(input, 0)
  })

  it('should throw InvalidCurrencyError if asset has no assetId', () => {
    const input = {
      asset: {
        symbol: 'DOT'
      }
    } as TXTokensTransferOptions<unknown, unknown>
    expect(() => unique.transferXTokens(input)).toThrowError()
  })
})
