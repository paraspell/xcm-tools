import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type Quartz from './Quartz'
import XTokensTransferImpl from '../xTokens'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Quartz', () => {
  let quartz: Quartz
  const mockInput = {
    currency: 'QTZ',
    amount: '100',
    currencyID: '123'
  } as XTokensTransferInput

  beforeEach(() => {
    quartz = getNode('Quartz')
  })

  it('should initialize with correct values', () => {
    expect(quartz.node).toBe('Quartz')
    expect(quartz.name).toBe('quartz')
    expect(quartz.type).toBe('kusama')
    expect(quartz.version).toBe(Version.V3)
    expect(quartz._assetCheckEnabled).toBe(false)
  })

  it('should call transferXTokens with ForeignAssetId', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    quartz.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { ForeignAssetId: '123' })
  })
})
