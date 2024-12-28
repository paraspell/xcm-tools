import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TPolkadotXCMTransferOptions } from '../../types'
import { Version } from '../../types'
import type Moonriver from './Moonriver'
import { getNode } from '../../utils'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import type { IPolkadotApi } from '../../api'
import { DOT_MULTILOCATION } from '../../constants'

vi.mock('../../pallets/polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

describe('Moonriver', () => {
  let node: Moonriver<unknown, unknown>

  const api = {
    createAccountId: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>
  const mockInput = {
    api,
    asset: {
      symbol: 'MOVR',
      amount: 100
    }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    node = getNode<unknown, unknown, 'Moonriver'>('Moonriver')
  })

  it('should initialize with correct values', () => {
    expect(node.node).toBe('Moonriver')
    expect(node.info).toBe('moonriver')
    expect(node.type).toBe('kusama')
    expect(node.version).toBe(Version.V3)
  })

  it('should use correct multiLocation when transfering native asset', async () => {
    const mockInputNative = {
      ...mockInput,
      scenario: 'ParaToPara',
      asset: { symbol: 'MOVR', amount: 100 }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await node.transferPolkadotXCM(mockInputNative)

    expect(spy).toHaveBeenCalledWith(
      {
        ...mockInputNative,
        currencySelection: {
          [Version.V3]: [
            {
              fun: {
                Fungible: mockInput.asset.amount
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
    const mockInputDot = {
      ...mockInput,
      scenario: 'ParaToRelay',
      asset: { symbol: 'DOT', amount: 100 }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await node.transferPolkadotXCM(mockInputDot)

    expect(spy).toHaveBeenCalledWith(
      {
        ...mockInputDot,
        currencySelection: {
          [Version.V3]: [
            {
              fun: {
                Fungible: mockInput.asset.amount
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
      },
      amount: 100
    }
    const mockInputUsdt = {
      ...mockInput,
      scenario: 'ParaToPara',
      asset
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const spy = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')

    await node.transferPolkadotXCM(mockInputUsdt)

    expect(spy).toHaveBeenCalledWith(
      {
        ...mockInputUsdt,
        currencySelection: {
          [Version.V3]: [
            {
              fun: {
                Fungible: mockInput.asset.amount
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

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = node.getRelayToParaOverrides()
    expect(result).toEqual({
      section: 'limited_reserve_transfer_assets',
      includeFee: true
    })
  })
})
