import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type ComposableFinance from './ComposableFinance'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('ComposableFinance', () => {
  let composableFinance: ComposableFinance<ApiPromise, Extrinsic>
  const mockInput = {
    asset: { symbol: 'LAYR', assetId: '123' },
    amount: '100'
  } as XTokensTransferInput<ApiPromise, Extrinsic>

  beforeEach(() => {
    composableFinance = getNode<ApiPromise, Extrinsic, 'ComposableFinance'>('ComposableFinance')
  })

  it('should initialize with correct values', () => {
    expect(composableFinance.node).toBe('ComposableFinance')
    expect(composableFinance.name).toBe('composable')
    expect(composableFinance.type).toBe('polkadot')
    expect(composableFinance.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    composableFinance.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, BigInt(123))
  })
})
