import { beforeEach, describe, expect, it, vi } from 'vitest'

import { transferXTokens } from '../../pallets/xTokens'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type ComposableFinance from './ComposableFinance'

vi.mock('../../pallets/xTokens', () => ({
  transferXTokens: vi.fn()
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
    composableFinance.transferXTokens(mockInput)
    expect(transferXTokens).toHaveBeenCalledWith(mockInput, 123n)
  })
})
