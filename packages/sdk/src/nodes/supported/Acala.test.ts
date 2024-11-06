import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import { getNode } from '../../utils/getNode'
import { getAllNodeProviders } from '../../utils/getAllNodeProviders'
import type Acala from './Acala'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

vi.mock('../../utils/getAllNodeProviders', () => ({
  getAllNodeProviders: vi.fn()
}))

describe('Acala', () => {
  let acala: Acala<ApiPromise, Extrinsic>
  const mockInput = {
    asset: { symbol: 'ACA' },
    amount: '100'
  } as XTokensTransferInput<ApiPromise, Extrinsic>
  const spyTransferXTokens = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

  beforeEach(() => {
    acala = getNode<ApiPromise, Extrinsic, 'Acala'>('Acala')
    spyTransferXTokens.mockClear()
  })

  it('should initialize with correct values', () => {
    expect(acala.node).toBe('Acala')
    expect(acala.name).toBe('acala')
    expect(acala.type).toBe('polkadot')
    expect(acala.version).toBe(Version.V3)
  })

  it('should call transferXTokens with Token when currencyID is undefined', () => {
    acala.transferXTokens(mockInput)

    expect(spyTransferXTokens).toHaveBeenCalledWith(mockInput, { Token: 'ACA' })
  })

  it('should call transferXTokens with ForeignAsset when currencyID is defined', () => {
    const inputWithCurrencyID = {
      ...mockInput,
      asset: {
        symbol: 'ACA',
        assetId: 1
      }
    }

    acala.transferXTokens(inputWithCurrencyID)

    expect(spyTransferXTokens).toHaveBeenCalledWith(inputWithCurrencyID, {
      ForeignAsset: 1
    })
  })

  it('should return the second WebSocket URL from getProvider', () => {
    const mockProviders = [
      'ws://unreliable-url',
      'ws://reliable-url',
      'ws://backup-url',
      'ws://backup-url2'
    ]
    vi.mocked(getAllNodeProviders).mockReturnValue(mockProviders)

    const provider = acala.getProvider()

    expect(getAllNodeProviders).toHaveBeenCalledWith(acala.node)
    expect(provider).toBe('ws://backup-url2')
  })
})
