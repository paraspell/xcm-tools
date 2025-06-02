import { InvalidCurrencyError } from '@paraspell/assets'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DOT_MULTILOCATION } from '../../constants'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { Version } from '../../types'
import { getNode } from '../../utils'
import type Moonbeam from './Moonbeam'

vi.mock('../../pallets/polkadotXcm', () => ({
  default: {
    transferPolkadotXCM: vi.fn()
  }
}))

type WithTransferToEthereum = Moonbeam<unknown, unknown> & {
  transferToEthereum: Moonbeam<unknown, unknown>['transferToEthereum']
}

describe('Moonbeam', () => {
  let node: Moonbeam<unknown, unknown>

  const api = {
    createAccountId: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>
  const mockInput = {
    api,
    asset: {
      symbol: 'GLMR',
      amount: 100
    }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    node = getNode<unknown, unknown, 'Moonbeam'>('Moonbeam')
  })

  it('should initialize with correct values', () => {
    expect(node.node).toBe('Moonbeam')
    expect(node.info).toBe('moonbeam')
    expect(node.type).toBe('polkadot')
    expect(node.version).toBe(Version.V3)
  })

  it('should use correct multiLocation when transfering native asset', async () => {
    const mockInputNative = {
      ...mockInput,
      scenario: 'ParaToPara',
      asset: { symbol: 'GLMR', amount: 100 }
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

  it('should call transferToEthereum when destination is Ethereum', async () => {
    const spyTransferToEth = vi
      .spyOn(node as WithTransferToEthereum, 'transferToEthereum')
      .mockResolvedValue({})

    const spyXcm = vi.spyOn(PolkadotXCMTransferImpl, 'transferPolkadotXCM')
    spyXcm.mockClear()

    const inputEth = {
      ...mockInput,
      destination: 'Ethereum',
      scenario: 'ParaToPara'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await node.transferPolkadotXCM(inputEth)

    expect(spyTransferToEth).toHaveBeenCalledTimes(1)
    expect(spyTransferToEth).toHaveBeenCalledWith(inputEth)

    expect(spyXcm).not.toHaveBeenCalled()
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = node.getRelayToParaOverrides()
    expect(result).toEqual({
      method: 'limited_reserve_transfer_assets',
      includeFee: true
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    it('should throw an error when asset is not a foreign asset', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      expect(() => node.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should throw an error when assetId is undefined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      expect(() => node.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        asset: { symbol: 'ACA', amount: '100', assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      node.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer',
        parameters: {
          target: mockOptions.address,
          id: 1n,
          amount: BigInt(mockOptions.asset.amount)
        }
      })
    })
  })
})
