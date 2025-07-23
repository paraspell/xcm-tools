import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferXTokens } from '../../pallets/xTokens'
import type { TXTokensTransferOptions } from '../../types'
import { getNode } from '../../utils'
import type Quartz from './Quartz'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
}))

describe('Quartz', () => {
  let quartz: Quartz<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'USDt', assetId: '123', amount: 100n }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    quartz = getNode<unknown, unknown, 'Quartz'>('Quartz')
  })

  it('should initialize with correct values', () => {
    expect(quartz.node).toBe('Quartz')
    expect(quartz.info).toBe('quartz')
    expect(quartz.type).toBe('kusama')
    expect(quartz.version).toBe(Version.V5)
  })

  it('should call transferXTokens with asset id', () => {
    quartz.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, 123)
  })

  it('should call transferXTokens with NativeAssetId', () => {
    const input = {
      asset: {
        ...mockInput.asset,
        symbol: 'QTZ'
      }
    } as TXTokensTransferOptions<unknown, unknown>
    quartz.transferXTokens(input)
    expect(transferXTokens).toHaveBeenCalledWith(input, 0)
  })

  it('should throw InvalidCurrencyError if asset has no assetId', () => {
    const input = {
      asset: {
        symbol: 'DOT'
      }
    } as TXTokensTransferOptions<unknown, unknown>
    expect(() => quartz.transferXTokens(input)).toThrowError()
  })
})
