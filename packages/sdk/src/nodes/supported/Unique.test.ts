import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import { getNode } from '../../utils/getNode'
import type Unique from './Unique'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Unique', () => {
  let unique: Unique<ApiPromise, Extrinsic>
  const mockInput = {
    asset: { symbol: 'UNQ', assetId: '123' },
    amount: '100'
  } as XTokensTransferInput<ApiPromise, Extrinsic>

  beforeEach(() => {
    unique = getNode<ApiPromise, Extrinsic, 'Unique'>('Unique')
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

    expect(spy).toHaveBeenCalledWith(mockInput, { ForeignAssetId: BigInt(123) })
  })
})
