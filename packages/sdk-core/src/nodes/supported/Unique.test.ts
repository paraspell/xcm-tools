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
    asset: { symbol: 'UNQ', assetId: '123', amount: '100' }
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

  it('should call transferXTokens with ForeignAssetId', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    unique.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { ForeignAssetId: 123n })
  })
})
