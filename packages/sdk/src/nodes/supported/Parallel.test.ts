import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Parallel from './Parallel'
import { getNode } from '../../utils/getNode'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Parallel', () => {
  let parallel: Parallel
  const mockInput = {
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    parallel = getNode('Parallel')
  })

  it('should initialize with correct values', () => {
    expect(parallel.node).toBe('Parallel')
    expect(parallel.name).toBe('parallel')
    expect(parallel.type).toBe('polkadot')
    expect(parallel.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    parallel.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, '123')
  })
})
