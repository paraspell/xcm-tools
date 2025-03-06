import { beforeEach, describe, expect, it, vi } from 'vitest'

import XTokensTransferImpl from '../../pallets/xTokens'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils/getNode'
import type Turing from './Turing'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Turing', () => {
  let turing: Turing<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'TUR', assetId: '123', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    turing = getNode<unknown, unknown, 'Turing'>('Turing')
  })

  it('should initialize with correct values', () => {
    expect(turing.node).toBe('Turing')
    expect(turing.info).toBe('turing')
    expect(turing.type).toBe('kusama')
    expect(turing.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    turing.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 123n)
  })
})
