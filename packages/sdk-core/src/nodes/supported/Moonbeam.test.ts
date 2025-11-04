import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { DOT_MULTILOCATION } from '../../constants'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { createTypeAndThenCall } from '../../transfer'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getNode } from '../../utils'
import type Moonbeam from './Moonbeam'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

vi.mock('../../transfer', () => ({
  createTypeAndThenCall: vi.fn()
}))

describe('Moonbeam', () => {
  let node: Moonbeam<unknown, unknown>

  const api = {
    createAccountId: vi.fn(),
    callTxMethod: vi.fn()
  } as unknown as IPolkadotApi<unknown, unknown>

  const mockInput = {
    api,
    version: Version.V5,
    senderAddress: 'senderAddress',
    asset: {
      symbol: 'GLMR',
      amount: 100n
    }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    vi.clearAllMocks()
    node = getNode<unknown, unknown, 'Moonbeam'>('Moonbeam')
  })

  it('should initialize with correct values', () => {
    expect(node.node).toBe('Moonbeam')
    expect(node.info).toBe('moonbeam')
    expect(node.type).toBe('polkadot')
    expect(node.version).toBe(Version.V5)
  })

  it('should use correct multiLocation when transfering native asset', async () => {
    const mockInputNative = {
      ...mockInput,
      scenario: 'ParaToPara',
      asset: { symbol: 'GLMR', amount: 100n }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await node.transferPolkadotXCM(mockInputNative)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      {
        ...mockInputNative,
        multiAsset: {
          fun: {
            Fungible: mockInput.asset.amount
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

  it('should use correct multiLocation when transfering DOT to relay', async () => {
    const mockInputDot = {
      ...mockInput,
      scenario: 'ParaToRelay',
      asset: { symbol: 'DOT', amount: 100n, multiLocation: DOT_MULTILOCATION }
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await node.transferPolkadotXCM(mockInputDot)

    expect(createTypeAndThenCall).toHaveBeenCalledTimes(1)
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
      amount: 100n
    }
    const mockInputUsdt = {
      ...mockInput,
      scenario: 'ParaToPara',
      asset
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    await node.transferPolkadotXCM(mockInputUsdt)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      {
        ...mockInputUsdt,
        multiAsset: {
          fun: {
            Fungible: mockInput.asset.amount
          },
          id: asset.multiLocation
        }
      },
      'transfer_assets',
      'Unlimited'
    )
  })

  it('should throw ScenarioNotSupportedError when destination is Ethereum', async () => {
    const inputEth = {
      ...mockInput,
      destination: 'Ethereum',
      scenario: 'ParaToPara'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    const executeTransfer = () => node.transferPolkadotXCM(inputEth)

    await expect(executeTransfer()).rejects.toThrow(ScenarioNotSupportedError)
    await expect(executeTransfer()).rejects.toThrow('Snowbridge is temporarily disabled.')
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
        asset: { symbol: 'ACA', amount: 100n, assetId: '1' },
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
