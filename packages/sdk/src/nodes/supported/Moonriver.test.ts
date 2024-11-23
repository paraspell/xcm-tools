import { describe, it, expect, vi, beforeEach } from 'vitest'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/constructRelayToParaParameters'
import type { TRelayToParaOptions, PolkadotXCMTransferInput } from '../../types'
import { Version } from '../../types'
import type Moonriver from './Moonriver'
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

describe('Moonriver', () => {
  let moonriver: Moonriver<ApiPromise, Extrinsic>

  const api = {
    createAccountId: vi.fn()
  } as unknown as IPolkadotApi<ApiPromise, Extrinsic>
  const mockInput = {
    amount: '100',
    api
  } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

  const mockOptions = {
    destination: 'Moonriver'
  } as TRelayToParaOptions<ApiPromise, Extrinsic>

  beforeEach(() => {
    moonriver = getNode<ApiPromise, Extrinsic, 'Moonriver'>('Moonriver')
  })

  it('should initialize with correct values', () => {
    expect(moonriver.node).toBe('Moonriver')
    expect(moonriver.info).toBe('moonriver')
    expect(moonriver.type).toBe('kusama')
    expect(moonriver.version).toBe(Version.V3)
  })

  it('should use correct multiLocation when transfering native asset', async () => {
    const asset = { symbol: 'MOVR' }
    const mockInputNative = {
      ...mockInput,
      scenario: 'ParaToPara',
      asset
    } as PolkadotXCMTransferInput<ApiPromise, Extrinsic>

    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await moonriver.transferPolkadotXCM(mockInputNative)

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

    await moonriver.transferPolkadotXCM(mockInputDot)

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

    await moonriver.transferPolkadotXCM(mockInputUsdt)

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

    const result = moonriver.transferRelayToPara(mockOptions)

    expect(constructRelayToParaParameters).toHaveBeenCalledWith(mockOptions, Version.V3, true)
    expect(result).toEqual({
      module: 'XcmPallet',
      section: 'limited_reserve_transfer_assets',
      parameters: expectedParameters
    })
  })

  describe('getProvider', () => {
    it('should return Moonbeam foundation provider', () => {
      expect(moonriver.getProvider()).toBe('wss://wss.api.moonriver.moonbeam.network')
    })
  })
})
