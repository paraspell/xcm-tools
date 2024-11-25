import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import { getNode } from '../../utils/getNode'
import type Zeitgeist from './Zeitgeist'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Zeitgeist', () => {
  let zeitgeist: Zeitgeist<ApiPromise, Extrinsic>
  const mockInput = {
    asset: { symbol: 'ZTG', assetId: '123' },
    amount: '100'
  } as TXTokensTransferOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    zeitgeist = getNode<ApiPromise, Extrinsic, 'Zeitgeist'>('Zeitgeist')
  })

  it('should initialize with correct values', () => {
    expect(zeitgeist.node).toBe('Zeitgeist')
    expect(zeitgeist.info).toBe('zeitgeist')
    expect(zeitgeist.type).toBe('polkadot')
    expect(zeitgeist.version).toBe(Version.V3)
  })

  it('should call transferXTokens with native asset "Ztg" when currency matches native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(zeitgeist, 'getNativeAssetSymbol').mockReturnValue('ZTG')

    zeitgeist.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'Ztg')
  })

  it('should call transferXTokens with ForeignAsset when currency does not match the native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(zeitgeist, 'getNativeAssetSymbol').mockReturnValue('NOT_ZTG')

    zeitgeist.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, {
      ForeignAsset: 123
    })
  })
})
