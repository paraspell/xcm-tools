import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type Quartz from './Quartz'
import XTokensTransferImpl from '../xTokens'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Quartz', () => {
  let quartz: Quartz<ApiPromise, Extrinsic>
  const mockInput = {
    asset: { symbol: 'QTZ', assetId: '123' },
    amount: '100'
  } as TXTokensTransferOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    quartz = getNode<ApiPromise, Extrinsic, 'Quartz'>('Quartz')
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

    expect(spy).toHaveBeenCalledWith(mockInput, { ForeignAssetId: BigInt(123) })
  })
})
