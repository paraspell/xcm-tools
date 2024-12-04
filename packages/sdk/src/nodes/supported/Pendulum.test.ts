import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  InvalidCurrencyError,
  NodeNotSupportedError,
  ScenarioNotSupportedError
} from '../../errors'
import type { TXTokensTransferOptions, TXcmAsset } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Pendulum from './Pendulum'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

describe('Pendulum', () => {
  let pendulum: Pendulum<ApiPromise, Extrinsic>
  const mockInput = {
    asset: { symbol: 'PEN', assetId: '123', amount: '100' },
    scenario: 'ParaToPara'
  } as TXTokensTransferOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    pendulum = getNode<ApiPromise, Extrinsic, 'Pendulum'>('Pendulum')
  })

  it('should initialize with correct values', () => {
    expect(pendulum.node).toBe('Pendulum')
    expect(pendulum.info).toBe('pendulum')
    expect(pendulum.type).toBe('polkadot')
    expect(pendulum.version).toBe(Version.V3)
  })

  it('should call transferXTokens with valid scenario and currency', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(pendulum, 'getNativeAssetSymbol').mockReturnValue('PEN')

    pendulum.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { XCM: 123 } as TXcmAsset)
  })

  it('should throw ScenarioNotSupportedError for unsupported scenario', () => {
    const invalidInput = { ...mockInput, scenario: 'ParaToRelay' } as TXTokensTransferOptions<
      ApiPromise,
      Extrinsic
    >

    expect(() => pendulum.transferXTokens(invalidInput)).toThrowError(ScenarioNotSupportedError)
  })

  it('should throw InvalidCurrencyError for unsupported currency', () => {
    vi.spyOn(pendulum, 'getNativeAssetSymbol').mockReturnValue('NOT_PEN')

    expect(() => pendulum.transferXTokens(mockInput)).toThrowError(
      new InvalidCurrencyError(`Asset PEN is not supported by node Pendulum.`)
    )
  })

  it('should throw NodeNotSupportedError for transferRelayToPara', () => {
    expect(() => pendulum.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })
})
