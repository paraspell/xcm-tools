import { describe, it, expect, vi, beforeEach } from 'vitest'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import type { XTokensTransferInput, TRelayToParaInternalOptions } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Moonriver from './Moonriver'
import { getNode } from '../../utils'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  constructRelayToParaParameters: vi.fn()
}))

describe('Moonriver', () => {
  let moonriver: Moonriver
  const mockInput = {
    currency: 'MOVR',
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput

  const mockOptions = {
    destination: 'Moonriver'
  } as TRelayToParaInternalOptions

  beforeEach(() => {
    moonriver = getNode('Moonriver')
  })

  it('should initialize with correct values', () => {
    expect(moonriver.node).toBe('Moonriver')
    expect(moonriver.name).toBe('moonriver')
    expect(moonriver.type).toBe('kusama')
    expect(moonriver.version).toBe(Version.V3)
  })

  it('should call transferXTokens with SelfReserve when currency matches native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(moonriver, 'getNativeAssetSymbol').mockReturnValue('MOVR')

    moonriver.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'SelfReserve')
  })

  it('should call transferXTokens with ForeignAsset when currency does not match native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(moonriver, 'getNativeAssetSymbol').mockReturnValue('NOT_MOVR')

    moonriver.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { ForeignAsset: '123' })
  })

  it('should call transferRelayToPara with the correct parameters', () => {
    const expectedParameters = [{ param: 'value' }] as unknown[]
    vi.mocked(constructRelayToParaParameters).mockReturnValue(expectedParameters)

    const result = moonriver.transferRelayToPara(mockOptions)

    expect(constructRelayToParaParameters).toHaveBeenCalledWith(mockOptions, Version.V3, true)
    expect(result).toEqual({
      module: 'xcmPallet',
      section: 'limitedReserveTransferAssets',
      parameters: expectedParameters
    })
  })
})
