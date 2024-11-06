import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import { getNode } from '../../utils/getNode'
import type Turing from './Turing'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Turing', () => {
  let turing: Turing<ApiPromise, Extrinsic>
  const mockInput = {
    asset: { symbol: 'TUR', assetId: '123' },
    amount: '100'
  } as XTokensTransferInput<ApiPromise, Extrinsic>

  beforeEach(() => {
    turing = getNode<ApiPromise, Extrinsic, 'Turing'>('Turing')
  })

  it('should initialize with correct values', () => {
    expect(turing.node).toBe('Turing')
    expect(turing.name).toBe('turing')
    expect(turing.type).toBe('kusama')
    expect(turing.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    turing.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, BigInt(123))
  })
})
