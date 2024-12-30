import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScenarioNotSupportedError, NodeNotSupportedError } from '../../errors'
import type { TXTokensTransferOptions } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../../pallets/xTokens'
import type Peaq from './Peaq'
import { getNode } from '../../utils/getNode'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Peaq', () => {
  let peaq: Peaq<unknown, unknown>
  const mockInput = {
    asset: { assetId: '123', amount: '100' },
    scenario: 'ParaToPara'
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    peaq = getNode<unknown, unknown, 'Peaq'>('Peaq')
  })

  it('should initialize with correct values', () => {
    expect(peaq.node).toBe('Peaq')
    expect(peaq.info).toBe('peaq')
    expect(peaq.type).toBe('polkadot')
    expect(peaq.version).toBe(Version.V2)
  })

  it('should call transferXTokens with valid scenario', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')

    peaq.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 123n)
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as TXTokensTransferOptions<
      unknown,
      unknown
    >

    expect(() => peaq.transferXTokens(invalidInput)).toThrowError(ScenarioNotSupportedError)
  })

  it('should throw NodeNotSupportedError for transferRelayToPara', () => {
    expect(() => peaq.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })
})
