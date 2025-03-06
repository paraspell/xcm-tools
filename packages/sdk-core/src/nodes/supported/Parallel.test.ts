import { beforeEach, describe, expect, it, vi } from 'vitest'

import XTokensTransferImpl from '../../pallets/xTokens'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils/getNode'
import type Parallel from './Parallel'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Parallel', () => {
  let parallel: Parallel<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'PARA', assetId: '123', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    parallel = getNode<unknown, unknown, 'Parallel'>('Parallel')
  })

  it('should initialize with correct values', () => {
    expect(parallel.node).toBe('Parallel')
    expect(parallel.info).toBe('parallel')
    expect(parallel.type).toBe('polkadot')
    expect(parallel.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    parallel.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 123n)
  })
})
