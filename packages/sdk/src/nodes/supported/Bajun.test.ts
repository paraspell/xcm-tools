import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ScenarioNotSupportedError,
  InvalidCurrencyError,
  NodeNotSupportedError
} from '../../errors'
import { Version, XTokensTransferInput } from '../../types'
import XTokensTransferImpl from '../xTokens'
import Bajun from './Bajun'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Bajun', () => {
  let bajun: Bajun
  const mockInput = {
    scenario: 'ParaToPara',
    currency: 'BAJ',
    amount: '100'
  } as XTokensTransferInput

  beforeEach(() => {
    bajun = getNode('Bajun')
  })

  it('should initialize with correct values', () => {
    expect(bajun.node).toBe('Bajun')
    expect(bajun.name).toBe('bajun')
    expect(bajun.type).toBe('kusama')
    expect(bajun.version).toBe(Version.V3)
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'RelayToPara' } as XTokensTransferInput

    expect(() => bajun.transferXTokens(invalidInput)).toThrowError(
      new ScenarioNotSupportedError(bajun.node, 'RelayToPara')
    )
  })

  it('should throw InvalidCurrencyError when currency does not match native asset', () => {
    const invalidInput = { ...mockInput, currency: 'INVALID' }
    vi.spyOn(bajun, 'getNativeAssetSymbol').mockReturnValue('BAJ')

    expect(() => bajun.transferXTokens(invalidInput)).toThrowError(
      new InvalidCurrencyError('Node Bajun does not support currency INVALID')
    )
  })

  it('should call transferXTokens with the correct currency', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(bajun, 'getNativeAssetSymbol').mockReturnValue('BAJ')

    bajun.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'BAJ')
  })

  it('should throw NodeNotSupportedError when calling transferRelayToPara', () => {
    expect(() => bajun.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })
})
