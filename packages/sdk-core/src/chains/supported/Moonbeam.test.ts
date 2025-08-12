import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DOT_LOCATION } from '../../constants'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { createTypeAndThenCall } from '../../transfer'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils'
import type Moonbeam from './Moonbeam'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

vi.mock('../../transfer', () => ({
  createTypeAndThenCall: vi.fn()
}))

type WithTransferToEthereum = Moonbeam<unknown, unknown> & {
  transferToEthereum: Moonbeam<unknown, unknown>['transferToEthereum']
}

describe('Moonbeam', () => {
  let chain: Moonbeam<unknown, unknown>

  const api = {
    createAccountId: vi.fn(),
    callTxMethod: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockInput = {
    api,
    version: Version.V5,
    senderAddress: 'senderAddress',
    assetInfo: {
      symbol: 'GLMR',
      amount: 100n
    }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    chain = getChain<unknown, unknown, 'Moonbeam'>('Moonbeam')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('Moonbeam')
    expect(chain.info).toBe('moonbeam')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V5)
  })

  it('should use correct location when transfering native asset', async () => {
    const mockInputNative = {
      ...mockInput,
      scenario: 'ParaToPara',
      assetInfo: { symbol: 'GLMR', amount: 100n }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(mockInputNative)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      {
        ...mockInputNative,
        asset: {
          fun: {
            Fungible: mockInput.assetInfo.amount
          },
          id: {
            parents: 0,
            interior: {
              X1: {
                PalletInstance: 10
              }
            }
          }
        }
      },
      'transfer_assets',
      'Unlimited'
    )
  })

  it('should use correct location when transfering DOT to relay', async () => {
    const mockInputDot = {
      ...mockInput,
      scenario: 'ParaToRelay',
      assetInfo: { symbol: 'DOT', amount: 100n, location: DOT_LOCATION }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(mockInputDot)

    expect(createTypeAndThenCall).toHaveBeenCalledTimes(1)
  })

  it('should use correct location when transfering USDT', async () => {
    const asset = {
      symbol: 'USDT',
      location: {
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
      amount: 100n
    }
    const mockInputUsdt = {
      ...mockInput,
      scenario: 'ParaToPara',
      assetInfo: asset
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(mockInputUsdt)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      {
        ...mockInputUsdt,
        asset: {
          fun: {
            Fungible: mockInput.assetInfo.amount
          },
          id: asset.location
        }
      },
      'transfer_assets',
      'Unlimited'
    )
  })

  it('should call transferToEthereum when destination is Ethereum', async () => {
    const spyTransferToEth = vi
      .spyOn(chain as WithTransferToEthereum, 'transferToEthereum')
      .mockResolvedValue({})

    const inputEth = {
      ...mockInput,
      destination: 'Ethereum',
      scenario: 'ParaToPara'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await chain.transferPolkadotXCM(inputEth)

    expect(spyTransferToEth).toHaveBeenCalledTimes(1)
    expect(spyTransferToEth).toHaveBeenCalledWith(inputEth)

    expect(transferPolkadotXcm).not.toHaveBeenCalled()
  })

  it('should call getRelayToParaOverrides with the correct parameters', () => {
    const result = chain.getRelayToParaOverrides()
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

      expect(() => chain.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
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

      expect(() => chain.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
    })

    it('should call transfer with ForeignAsset when assetId is defined', () => {
      const mockApi = {
        callTxMethod: vi.fn()
      }

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'ACA', amount: 100n, assetId: '1' },
        address: 'address'
      } as unknown as TTransferLocalOptions<unknown, unknown>

      chain.transferLocalNonNativeAsset(mockOptions)

      expect(mockApi.callTxMethod).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer',
        parameters: {
          target: mockOptions.address,
          id: 1n,
          amount: BigInt(mockOptions.assetInfo.amount)
        }
      })
    })
  })
})
