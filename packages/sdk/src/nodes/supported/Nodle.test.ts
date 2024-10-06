import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  InvalidCurrencyError,
  NodeNotSupportedError,
  ScenarioNotSupportedError
} from '../../errors'
import type { XTokensTransferInput, TNodleAsset } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Nodle from './Nodle'
import { getNode } from '../../utils/getNode'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Nodle', () => {
  let nodle: Nodle
  const mockInput = {
    currency: 'NODL',
    scenario: 'ParaToPara',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    nodle = getNode('Nodle')
  })

  it('should initialize with correct values', () => {
    expect(nodle.node).toBe('Nodle')
    expect(nodle.name).toBe('nodle')
    expect(nodle.type).toBe('polkadot')
    expect(nodle.version).toBe(Version.V3)
  })

  it('should call transferXTokens with valid scenario and currency', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(nodle, 'getNativeAssetSymbol').mockReturnValue('NODL')

    nodle.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'NodleNative' as TNodleAsset)
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as XTokensTransferInput

    expect(() => nodle.transferXTokens(invalidInput)).toThrowError(ScenarioNotSupportedError)
  })

  it('should throw InvalidCurrencyError for unsupported currency', () => {
    vi.spyOn(nodle, 'getNativeAssetSymbol').mockReturnValue('NOT_NODL')

    expect(() => nodle.transferXTokens(mockInput)).toThrowError(
      new InvalidCurrencyError(`Asset NODL is not supported by node Nodle.`)
    )
  })

  it('should throw NodeNotSupportedError for transferRelayToPara', () => {
    expect(() => nodle.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })
})
