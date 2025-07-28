import { InvalidCurrencyError } from '@paraspell/assets'
import { Parents, Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getNode } from '../../utils'
import { createAsset } from '../../utils/asset'
import type Darwinia from './Darwinia'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

vi.mock('../../utils/asset', () => ({
  createAsset: vi.fn()
}))

describe('Darwinia', () => {
  let darwinia: Darwinia<unknown, unknown>

  const mockPolkadotXCMInput = {
    scenario: 'ParaToRelay',
    assetInfo: { symbol: 'DOT', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    darwinia = getNode<unknown, unknown, 'Darwinia'>('Darwinia')
  })

  it('should initialize with correct values', () => {
    expect(darwinia.node).toBe('Darwinia')
    expect(darwinia.info).toBe('darwinia')
    expect(darwinia.type).toBe('polkadot')
    expect(darwinia.version).toBe(Version.V4)
  })

  it('should call transferPolkadotXCM with limitedReserveTransferAssets for ParaToRelay scenario', async () => {
    await darwinia.transferPolkadotXCM(mockPolkadotXCMInput)

    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      mockPolkadotXCMInput,
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })

  it('should throw error for ParaToPara scenario', () => {
    const input = {
      ...mockPolkadotXCMInput,
      scenario: 'ParaToPara'
    } as TPolkadotXCMTransferOptions<unknown, unknown>

    expect(() => darwinia.transferPolkadotXCM(input)).toThrow(ScenarioNotSupportedError)
  })

  it('should call createCurrencySpec with correct values', () => {
    darwinia.createCurrencySpec(100n, 'ParaToPara', darwinia.version)
    expect(createAsset).toHaveBeenCalledWith(darwinia.version, 100n, {
      parents: Parents.ZERO,
      interior: {
        X1: {
          PalletInstance: 5
        }
      }
    })
  })

  it('should call createCurrencySpec with correct values - ParaToRelay', () => {
    darwinia.createCurrencySpec(100n, 'ParaToRelay', darwinia.version)
    expect(createAsset).toHaveBeenCalledWith(darwinia.version, 100n, {
      parents: Parents.ZERO,
      interior: {
        X1: {
          PalletInstance: 5
        }
      }
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

      expect(() => darwinia.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
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

      expect(() => darwinia.transferLocalNonNativeAsset(mockOptions)).toThrow(InvalidCurrencyError)
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

      darwinia.transferLocalNonNativeAsset(mockOptions)

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
