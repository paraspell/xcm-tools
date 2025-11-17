import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils'
import type NeuroWeb from './NeuroWeb'

vi.mock('../../pallets/polkadotXcm', () => ({
  transferPolkadotXcm: vi.fn()
}))

describe('NeuroWeb', () => {
  let neuroweb: NeuroWeb<unknown, unknown>
  const mockInput = {
    assetInfo: { symbol: 'DOT', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown>

  beforeEach(() => {
    neuroweb = getChain<unknown, unknown, 'NeuroWeb'>('NeuroWeb')
  })

  it('should initialize with correct values', () => {
    expect(neuroweb.chain).toBe('NeuroWeb')
    expect(neuroweb.info).toBe('neuroweb')
    expect(neuroweb.ecosystem).toBe('Polkadot')
    expect(neuroweb.version).toBe(Version.V4)
  })

  it('should call transferPolkadotXCM with the correct arguments', async () => {
    await neuroweb.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(
      mockInput,
      'limited_reserve_transfer_assets',
      'Unlimited'
    )
  })

  describe('transferLocalNativeAsset', () => {
    let mockApi: IPolkadotApi<unknown, unknown>
    let deserializeExtrinsics: ReturnType<typeof vi.fn>

    beforeEach(() => {
      deserializeExtrinsics = vi.fn()
      mockApi = {
        deserializeExtrinsics
      } as unknown as IPolkadotApi<unknown, unknown>
    })

    it('should call transfer_keep_alive when not sending entire balance', async () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'NEURO', amount: 123n },
        address: '5F3sa2TYSF9Kxxxxx',
        balance: 999n,
        isAmountAll: false
      } as unknown as TTransferLocalOptions<unknown, unknown>

      await neuroweb.transferLocalNativeAsset(mockOptions)

      expect(deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Balances',
        method: 'transfer_keep_alive',
        params: {
          dest: mockOptions.address,
          value: mockOptions.assetInfo.amount
        }
      })
    })

    it('should call transfer_all when sending entire balance', async () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'NEURO', amount: 123n },
        address: '5F3sa2TYSF9Kxxxxx',
        balance: 456n,
        isAmountAll: true
      } as unknown as TTransferLocalOptions<unknown, unknown>

      await neuroweb.transferLocalNativeAsset(mockOptions)

      expect(deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Balances',
        method: 'transfer_all',
        params: {
          dest: mockOptions.address,
          keep_alive: false
        }
      })
    })
  })

  describe('transferLocalNonNativeAsset', () => {
    let mockApi: IPolkadotApi<unknown, unknown>
    let deserializeExtrinsics: ReturnType<typeof vi.fn>

    beforeEach(() => {
      deserializeExtrinsics = vi.fn()
      mockApi = {
        deserializeExtrinsics
      } as unknown as IPolkadotApi<unknown, unknown>
    })

    it('should call Assets.transfer with asset amount when not sending entire balance', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'USDT', assetId: '42', amount: 321n },
        address: '5CLocalDest',
        balance: 999n,
        isAmountAll: false
      } as unknown as TTransferLocalOptions<unknown, unknown>

      neuroweb.transferLocalNonNativeAsset(mockOptions)

      expect(deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer',
        params: {
          id: 42n,
          target: mockOptions.address,
          amount: mockOptions.assetInfo.amount
        }
      })
    })

    it('should call Assets.transfer with full balance when isAmountAll is true', () => {
      const expectedResult = Symbol('transfer-result')

      deserializeExtrinsics.mockReturnValue(expectedResult)

      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'USDT', assetId: '7', amount: 321n },
        address: '5CLocalDest',
        balance: 777n,
        isAmountAll: true
      } as unknown as TTransferLocalOptions<unknown, unknown>

      const result = neuroweb.transferLocalNonNativeAsset(mockOptions)

      expect(deserializeExtrinsics).toHaveBeenCalledWith({
        module: 'Assets',
        method: 'transfer',
        params: {
          id: 7n,
          target: mockOptions.address,
          amount: mockOptions.balance
        }
      })
      expect(result).toBe(expectedResult)
    })
  })
})
