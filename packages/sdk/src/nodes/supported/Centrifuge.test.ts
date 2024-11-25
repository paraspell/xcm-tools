import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type { Centrifuge } from './Centrifuge'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Centrifuge', () => {
  let centrifuge: Centrifuge<ApiPromise, Extrinsic>
  const mockInput = {
    asset: {
      symbol: 'CFG',
      assetId: '123'
    },
    amount: '100'
  } as TXTokensTransferOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    centrifuge = getNode<ApiPromise, Extrinsic, 'Centrifuge'>('Centrifuge')
  })

  it('should initialize with correct values', () => {
    expect(centrifuge.node).toBe('Centrifuge')
    expect(centrifuge.info).toBe('centrifuge')
    expect(centrifuge.type).toBe('polkadot')
    expect(centrifuge.version).toBe(Version.V3)
  })

  it('should call transferXTokens with Native when currency matches native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(centrifuge, 'getNativeAssetSymbol').mockReturnValue('CFG')

    centrifuge.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'Native')
  })

  it('should call transferXTokens with ForeignAsset when currency does not match native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(centrifuge, 'getNativeAssetSymbol').mockReturnValue('NOT_CFG')

    centrifuge.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { ForeignAsset: 123 })
  })
})
