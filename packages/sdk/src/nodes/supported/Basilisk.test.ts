import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import { getNode } from '../../utils/getNode'
import type Basilisk from './Basilisk'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'
import { getNodeProviders } from '../config'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

vi.mock('../config', () => ({
  getNodeProviders: vi.fn()
}))

describe('Basilisk', () => {
  let basilisk: Basilisk<ApiPromise, Extrinsic>
  const mockInput = {
    asset: { symbol: 'BSX', assetId: '123' },
    amount: '100'
  } as XTokensTransferInput<ApiPromise, Extrinsic>

  const mockProviders = ['wss://non-preferred-rpc', 'wss://preferred-dwellir-rpc']

  beforeEach(() => {
    basilisk = getNode<ApiPromise, Extrinsic, 'Basilisk'>('Basilisk')
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

  it('should return the second provider URL from getProvider', () => {
    const provider = basilisk.getProvider()

    expect(getNodeProviders).toHaveBeenCalledWith(basilisk.node)
    expect(provider).toBe('wss://preferred-dwellir-rpc')
  })
})
