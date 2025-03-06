import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  InvalidCurrencyError,
  NodeNotSupportedError,
  ScenarioNotSupportedError
} from '../../errors'
import XTokensTransferImpl from '../../pallets/xTokens'
import type { TNativeAsset, TXTokensTransferOptions, WithAmount } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type Bajun from './Bajun'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Bajun', () => {
  let bajun: Bajun<unknown, unknown>
  const mockInput = {
    scenario: 'ParaToPara',
    asset: { symbol: 'BAJ', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    bajun = getNode<unknown, unknown, 'Bajun'>('Bajun')
  })

  it('should initialize with correct values', () => {
    expect(bajun.node).toBe('Bajun')
    expect(bajun.info).toBe('bajun')
    expect(bajun.type).toBe('kusama')
    expect(bajun.version).toBe(Version.V3)
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'RelayToPara' } as TXTokensTransferOptions<
      unknown,
      unknown
    >

    expect(() => bajun.transferXTokens(invalidInput)).toThrowError(
      new ScenarioNotSupportedError(bajun.node, 'RelayToPara')
    )
  })

  it('should throw InvalidCurrencyError when currency does not match native asset', () => {
    const invalidInput = {
      ...mockInput,
      asset: {
        symbol: 'INVALID',
        isNative: true,
        amount: '100'
      } as WithAmount<TNativeAsset>
    }
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
