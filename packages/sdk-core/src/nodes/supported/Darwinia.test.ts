import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  TXTokensTransferOptions,
  TScenario,
  TSelfReserveAsset,
  TXcmForeignAsset,
  TXcmVersioned,
  TMultiAsset
} from '../../types'
import { Version, Parents } from '../../types'
import { NodeNotSupportedError } from '../../errors'
import XTokensTransferImpl from '../../pallets/xTokens'
import type Darwinia from './Darwinia'
import { createCurrencySpec } from '../../pallets/xcmPallet/utils'
import { getNode } from '../../utils'
import ParachainNode from '../ParachainNode'

vi.mock('../../pallets/xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  createCurrencySpec: vi.fn()
}))

describe('Darwinia', () => {
  let darwinia: Darwinia<unknown, unknown>
  const mockInput = {
    asset: { symbol: 'RING', assetId: '123', amount: '100' }
  } as TXTokensTransferOptions<unknown, unknown>

  beforeEach(() => {
    darwinia = getNode<unknown, unknown, 'Darwinia'>('Darwinia')
  })

  it('should initialize with correct values', () => {
    expect(darwinia.node).toBe('Darwinia')
    expect(darwinia.info).toBe('darwinia')
    expect(darwinia.type).toBe('polkadot')
    expect(darwinia.version).toBe(Version.V3)
  })

  it('should call transferXTokens with SelfReserve when currency matches native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(darwinia, 'getNativeAssetSymbol').mockReturnValue('RING')

    darwinia.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'SelfReserve' as TSelfReserveAsset)
  })

  it('should call transferXTokens with ForeignAsset when currency does not match native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(darwinia, 'getNativeAssetSymbol').mockReturnValue('NOT_RING')

    darwinia.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { ForeignAsset: 123n } as TXcmForeignAsset)
  })

  it('should throw NodeNotSupportedError for transferRelayToPara', () => {
    expect(() => darwinia.transferRelayToPara()).toThrowError(NodeNotSupportedError)
  })

  it('should call createCurrencySpec with PalletInstance 5 for ParaToPara scenario', () => {
    const expectedSpec = { [Version.V4]: [] } as TXcmVersioned<TMultiAsset[]>
    const mockScenario: TScenario = 'ParaToPara'
    const mockAmount = '100'
    const mockVersion = Version.V4
    vi.mocked(createCurrencySpec).mockReturnValue(expectedSpec)

    const result = darwinia.createCurrencySpec(mockAmount, mockScenario, mockVersion)

    expect(createCurrencySpec).toHaveBeenCalledWith(
      mockAmount,
      mockVersion,
      Parents.ZERO,
      undefined,
      { X1: { PalletInstance: 5 } }
    )
    expect(result).toEqual(expectedSpec)
  })

  it('should call the superclass createCurrencySpec for non-ParaToPara scenarios', () => {
    const spy = vi.spyOn(ParachainNode.prototype, 'createCurrencySpec')

    const mockScenario: TScenario = 'RelayToPara'
    const mockAmount = '100'
    const mockVersion = Version.V3

    darwinia.createCurrencySpec(mockAmount, mockScenario, mockVersion)

    expect(spy).toHaveBeenCalledWith(mockAmount, mockScenario, mockVersion, undefined, undefined)
  })
})
