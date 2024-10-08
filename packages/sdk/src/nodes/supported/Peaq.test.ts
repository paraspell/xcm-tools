import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScenarioNotSupportedError, NodeNotSupportedError } from '../../errors'
import type { XTokensTransferInput } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Peaq from './Peaq'
import { getNode } from '../../utils/getNode'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Peaq', () => {
  let peaq: Peaq
  const mockInput = {
    currencyID: '123',
    scenario: 'ParaToPara',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    peaq = getNode('Peaq')
  })

  it('should initialize with correct values', () => {
    expect(peaq.node).toBe('Peaq')
    expect(peaq.name).toBe('peaq')
    expect(peaq.type).toBe('polkadot')
    expect(peaq.version).toBe(Version.V2)
  })

  it('should call transferXTokens with valid scenario', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    peaq.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, '123')
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as XTokensTransferInput

    expect(() => peaq.transferXTokens(invalidInput)).toThrowError(ScenarioNotSupportedError)
  })

  it('should throw NodeNotSupportedError for transferRelayToPara', () => {
    expect(() => peaq.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })

  it('should return the correct provider URL', () => {
    const provider = peaq.getProvider()
    expect(provider).toBe('wss://peaq.api.onfinality.io/public-ws')
  })
})
