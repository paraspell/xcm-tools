import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TXTokensTransferOptions, TSelfReserveAsset } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Litentry from './Litentry'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Litentry', () => {
  let litentry: Litentry<unknown, unknown>
  const mockInput = {
    asset: { assetId: '123', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    litentry = getNode<unknown, unknown, 'Litentry'>('Litentry')
  })

  it('should initialize with correct values', () => {
    expect(litentry.node).toBe('Litentry')
    expect(litentry.info).toBe('litentry')
    expect(litentry.type).toBe('polkadot')
    expect(litentry.version).toBe(Version.V3)
  })

  it('should call transferXTokens with SelfReserve', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    litentry.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'SelfReserve' as TSelfReserveAsset)
  })
})
