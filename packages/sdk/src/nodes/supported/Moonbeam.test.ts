import { describe, it, expect, vi, beforeEach } from 'vitest'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import { getNode } from '../../utils'
import { getAllNodeProviders } from '../../utils/getAllNodeProviders'
import type { XTokensTransferInput, TRelayToParaInternalOptions } from '../../types'
import { Version } from '../../types'
import XTokensTransferImpl from '../xTokens'
import type Moonbeam from './Moonbeam'

vi.mock('../xTokens', () => ({
  default: {
    transferXTokens: vi.fn()
  }
}))

vi.mock('../../pallets/xcmPallet/utils', () => ({
  constructRelayToParaParameters: vi.fn()
}))

vi.mock('../../utils/getAllNodeProviders', () => ({
  getAllNodeProviders: vi.fn()
}))

describe('Moonbeam', () => {
  let moonbeam: Moonbeam
  const mockInput = {
    currency: 'GLMR',
    currencyID: '123',
    amount: '100'
  } as XTokensTransferInput

  const mockOptions = {
    destination: 'Moonbeam'
  } as TRelayToParaInternalOptions

  beforeEach(() => {
    moonbeam = getNode('Moonbeam')
  })

  it('should initialize with correct values', () => {
    expect(moonbeam.node).toBe('Moonbeam')
    expect(moonbeam.name).toBe('moonbeam')
    expect(moonbeam.type).toBe('polkadot')
    expect(moonbeam.version).toBe(Version.V3)
  })

  it('should call transferXTokens with SelfReserve when currency matches native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(moonbeam, 'getNativeAssetSymbol').mockReturnValue('GLMR')

    moonbeam.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, 'SelfReserve')
  })

  it('should call transferXTokens with ForeignAsset when currency does not match native asset', () => {
    const spy = vi.spyOn(XTokensTransferImpl, 'transferXTokens')
    vi.spyOn(moonbeam, 'getNativeAssetSymbol').mockReturnValue('NOT_GLMR')

    moonbeam.transferXTokens(mockInput)

    expect(spy).toHaveBeenCalledWith(mockInput, { ForeignAsset: '123' })
  })

  it('should call transferRelayToPara with the correct parameters', () => {
    const expectedParameters = [{ param: 'value' }] as unknown[]
    vi.mocked(constructRelayToParaParameters).mockReturnValue(expectedParameters)

    const result = moonbeam.transferRelayToPara(mockOptions)

    expect(constructRelayToParaParameters).toHaveBeenCalledWith(mockOptions, Version.V3, true)
    expect(result).toEqual({
      module: 'xcmPallet',
      section: 'limitedReserveTransferAssets',
      parameters: expectedParameters
    })
  })

  it('should return the third provider URL from getProvider', () => {
    const mockProviders = ['ws://provider1', 'ws://provider2', 'ws://provider3']
    vi.mocked(getAllNodeProviders).mockReturnValue(mockProviders)

    const provider = moonbeam.getProvider()

    expect(getAllNodeProviders).toHaveBeenCalledWith('Moonbeam')
    expect(provider).toBe('ws://provider3')
  })
})
