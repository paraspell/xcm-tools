import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../../pallets/xTokens'
import type ComposableFinance from './ComposableFinance'
import { getNode } from '../../utils'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('ComposableFinance', () => {
  let composableFinance: ComposableFinance<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'LAYR', assetId: '123', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    composableFinance = getNode<unknown, unknown, 'ComposableFinance'>('ComposableFinance')
  })

  it('should initialize with correct values', () => {
    expect(composableFinance.node).toBe('ComposableFinance')
    expect(composableFinance.info).toBe('composable')
    expect(composableFinance.type).toBe('polkadot')
    expect(composableFinance.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    composableFinance.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, BigInt(123))
  })
})
