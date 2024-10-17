import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Polkadex from './Polkadex'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Polkadex', () => {
  let polkadex: Polkadex<ApiPromise, Extrinsic>
  const mockInput = {
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput<ApiPromise, Extrinsic>

  beforeEach(() => {
    polkadex = getNode<ApiPromise, Extrinsic, 'Polkadex'>('Polkadex')
  })

  it('should initialize with correct values', () => {
    expect(polkadex.node).toBe('Polkadex')
    expect(polkadex.name).toBe('polkadex')
    expect(polkadex.type).toBe('polkadot')
    expect(polkadex.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    polkadex.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, '123')
  })
})
