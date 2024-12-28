import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../../pallets/xTokens'
import { getNode } from '../../utils/getNode'
import type Basilisk from './Basilisk'
import { getNodeProviders } from '../config'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

vi.mock('../config', () => ({
  getNodeProviders: vi.fn()
}))

describe('Basilisk', () => {
  let basilisk: Basilisk<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'BSX', assetId: '123', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  const mockProviders = ['wss://non-preferred-rpc', 'wss://preferred-dwellir-rpc']

  beforeEach(() => {
    basilisk = getNode<unknown, unknown, 'Basilisk'>('Basilisk')
    vi.mocked(getNodeProviders).mockReturnValue(mockProviders)
  })

  it('should initialize with correct values', () => {
    expect(basilisk.node).toBe('Basilisk')
    expect(basilisk.info).toBe('basilisk')
    expect(basilisk.type).toBe('kusama')
    expect(basilisk.version).toBe(Version.V3)
  })

  it('should call transferXTokens with currencyID', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    basilisk.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, Number(123))
  })
})
