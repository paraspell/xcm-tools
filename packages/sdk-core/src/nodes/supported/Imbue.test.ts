import { beforeEach, describe, expect, it, vi } from 'vitest'

import XTokensTransferImpl from '../../pallets/xTokens'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type Imbue from './Imbue'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Imbue', () => {
  let imbue: Imbue<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'IMBU', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    imbue = getNode<unknown, unknown, 'Imbue'>('Imbue')
  })

  it('should initialize with correct values', () => {
    expect(imbue.node).toBe('Imbue')
    expect(imbue.info).toBe('imbue')
    expect(imbue.type).toBe('kusama')
    expect(imbue.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currency', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    imbue.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'IMBU')
  })
})
