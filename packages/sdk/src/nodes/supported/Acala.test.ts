import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Version, XTokensTransferInput } from '../../types'
import XTokensTransferImpl from '../xTokens'
import { getNode } from '../../utils/getNode'
import { getAllNodeProviders } from '../../utils/getAllNodeProviders'
import Acala from './Acala'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

vi.mock('../../utils/getAllNodeProviders', () => ({
  getAllNodeProviders: vi.fn()
}))

describe('Acala', () => {
  let acala: Acala
  const mockInput = {
    currency: 'ACA',
    amount: '100'
  } as XTokensTransferInput
  const spyTransferXTokens = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

  beforeEach(() => {
    acala = getNode('Acala')
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
    const inputWithCurrencyID = { ...mockInput, currencyID: '1' }

    acala.transferXTokens(inputWithCurrencyID)

    expect(spyTransferXTokens).toHaveBeenCalledWith(inputWithCurrencyID, {
      ForeignAsset: '1'
    })
  })

  it('should return the second WebSocket URL from getProvider', () => {
    const mockProviders = ['ws://unreliable-url', 'ws://reliable-url']
    vi.mocked(getAllNodeProviders).mockReturnValue(mockProviders)

    const provider = acala.getProvider()

    expect(getAllNodeProviders).toHaveBeenCalledWith(acala.node)
    expect(provider).toBe('ws://reliable-url')
  })
})
