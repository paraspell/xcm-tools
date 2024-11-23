import { describe, it, expect, vi, beforeEach } from 'vitest'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/constructRelayToParaParameters'
import type { TRelayToParaOptions, PolkadotXCMTransferInput } from '../../types'
import { Version } from '../../types'
import type Moonbeam from './Moonbeam'
import { getNode } from '../../utils'
import type { ApiPromise } from '@polkadot/api'
import type { Extrinsic } from '../../pjs/types'
import PolkadotXCMTransferImpl from '../polkadotXcm'
import type { IPolkadotApi } from '../../api'
import { DOT_MULTILOCATION } from '../../const'

vi.mock('../polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

vi.mock('../../pallets/xcmPallet/constructRelayToParaParameters', () => ({
  constructRelayToParaParameters: vi.fn()
}))

describe('Moonbeam', () => {
  let moonbeam: Moonbeam<ApiPromise, Extrinsic>

  const api = {
    createAccountId: vi.fn()
  } as unknown as IPolkadotApi<ApiPromise, Extrinsic>
  const mockInput = {
    amount: '100',
    api
  } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

  const mockOptions = {
    destination: 'Moonbeam'
  } as TRelayToParaOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    moonbeam = getNode<ApiPromise, Extrinsic, 'Moonbeam'>('Moonbeam')
  })

  it('should initialize with correct values', () => {
    expect(moonbeam.node).toBe('Moonbeam')
    expect(moonbeam.info).toBe('moonbeam')
    expect(moonbeam.type).toBe('polkadot')
    expect(moonbeam.version).toBe(Version.V3)
  })

  it('should use correct multiLocation when transfering native asset', async () => {
    const asset = { symbol: 'GLMR' }
    const mockInputNative = {
      ...mockInput,
      scenario: 'ParaToPara',
      asset
    } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await moonbeam.transferPolkadotXCM(mockInputNative)

    expect(spy).toHaveBeenCalledWith(
      {
        ...mockInputNative,
        currencySelection: {
          [Version.V3]: [
            {
              fun: {
                Fungible: mockInput.amount
              },
              id: {
                Concrete: {
                  parents: 0,
                  interior: {
                    X1: {
                      PalletInstance: 10
                    }
                  }
                }
              }
            }
          ]
        }
      },
      'transfer_assets',
      'Unlimited'
    )
  })

  it('should use correct multiLocation when transfering DOT to relay', async () => {
    const asset = { symbol: 'DOT' }
    const mockInputDot = {
      ...mockInput,
      scenario: 'ParaToRelay',
      asset
    } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await moonbeam.transferPolkadotXCM(mockInputDot)

    expect(spy).toHaveBeenCalledWith(
      {
        ...mockInputDot,
        currencySelection: {
          [Version.V3]: [
            {
              fun: {
                Fungible: mockInput.amount
              },
              id: {
                Concrete: DOT_MULTILOCATION
              }
            }
          ]
        }
      },
      'transfer_assets',
      'Unlimited'
    )
  })

  it('should use correct multiLocation when transfering USDT', async () => {
    const asset = {
      symbol: 'USDT',
      multiLocation: {
        parents: 1,
        interior: {
          X3: [
            {
              Parachain: 1000
            },
            {
              PalletInstance: 50
            },
            {
              GeneralIndex: 1984
            }
          ]
        }
      }
    }
    const mockInputUsdt = {
      ...mockInput,
      scenario: 'ParaToPara',
      asset
    } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await moonbeam.transferPolkadotXCM(mockInputUsdt)

    expect(spy).toHaveBeenCalledWith(
      {
        ...mockInputUsdt,
        currencySelection: {
          [Version.V3]: [
            {
              fun: {
                Fungible: mockInput.amount
              },
              id: {
                Concrete: asset.multiLocation
              }
            }
          ]
        }
      },
      'transfer_assets',
      'Unlimited'
    )
  })

  it('should call transferRelayToPara with the correct parameters', () => {
    const expectedParameters = { param: 'value' }
    vi.mocked(constructRelayToParaParameters).mockReturnValue(expectedParameters)

    const result = moonbeam.transferRelayToPara(mockOptions)

    expect(constructRelayToParaParameters).toHaveBeenCalledWith(mockOptions, Version.V3, true)
    expect(result).toEqual({
      module: 'XcmPallet',
      section: 'limited_reserve_transfer_assets',
      parameters: expectedParameters
    })
  })
})
