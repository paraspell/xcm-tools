import { describe, it, expect, vi, beforeEach } from 'vitest'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import type { XTokensTransferInput, TRelayToParaOptions } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Moonriver from './Moonriver'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  constructRelayToParaParameters: vi.fn()
}))

describe('Moonriver', () => {
  let moonriver: Moonriver<ApiPromise, Extrinsic>
  const mockInput = {
    asset: { symbol: 'MOVR', assetId: '123' },
    amount: '100'
  } as XTokensTransferInput<ApiPromise, Extrinsic>

  const mockOptions = {
    destination: 'Moonriver'
  } as TRelayToParaOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    moonriver = getNode<ApiPromise, Extrinsic, 'Moonriver'>('Moonriver')
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

    expect(spy).toHaveBeenCalledWith(mockInput, { ForeignAsset: BigInt(123) })
  })

  it('should call transferRelayToPara with the correct parameters', () => {
    const expectedParameters = { param: 'value' }
    vi.mocked(constructRelayToParaParameters).mockReturnValue(expectedParameters)

    const result = moonriver.transferRelayToPara(mockOptions)

    expect(constructRelayToParaParameters).toHaveBeenCalledWith(mockOptions, Version.V3, true)
    expect(result).toEqual({
      module: 'XcmPallet',
      section: 'limited_reserve_transfer_assets',
      parameters: expectedParameters
    })
  })
})
