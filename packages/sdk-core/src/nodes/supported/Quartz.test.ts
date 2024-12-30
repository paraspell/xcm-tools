import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type Quartz from './Quartz'
import XTokensTransferImpl from '../../pallets/xTokens'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Quartz', () => {
  let quartz: Quartz<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'QTZ', assetId: '123', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    quartz = getNode<unknown, unknown, 'Quartz'>('Quartz')
  })

  it('should initialize with correct values', () => {
    expect(quartz.node).toBe('Quartz')
    expect(quartz.info).toBe('quartz')
    expect(quartz.type).toBe('kusama')
    expect(quartz.version).toBe(Version.V3)
    expect(quartz._assetCheckEnabled).toBe(false)
  })

  it('should call transferXTokens with ForeignAssetId', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    quartz.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { ForeignAssetId: 123n })
  })
})
