import { Version } from '@paraspell/sdk-common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IPolkadotApi } from '../../api'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TPolkadotXCMTransferOptions, TTransferLocalOptions } from '../../types'
import { getChain } from '../../utils'
import type NeuroWeb from './NeuroWeb'

vi.mock('../../pallets/polkadotXcm')

describe('NeuroWeb', () => {
  let chain: NeuroWeb<unknown, unknown, unknown>

  const mockInput = {
    assetInfo: { symbol: 'DOT', amount: 100n }
  } as TPolkadotXCMTransferOptions<unknown, unknown, unknown>

  beforeEach(() => {
    chain = getChain<unknown, unknown, unknown, 'NeuroWeb'>('NeuroWeb')
  })

  it('should initialize with correct values', () => {
    expect(chain.chain).toBe('NeuroWeb')
    expect(chain.info).toBe('neuroweb')
    expect(chain.ecosystem).toBe('Polkadot')
    expect(chain.version).toBe(Version.V4)
  })

  it('should call transferPolkadotXCM with the correct arguments', async () => {
    await chain.transferPolkadotXCM(mockInput)
    expect(transferPolkadotXcm).toHaveBeenCalledWith(mockInput)
  })

  describe('transferLocalNativeAsset', () => {
    let mockApi: IPolkadotApi<unknown, unknown, unknown>
    let deserializeExtrinsics: ReturnType<typeof vi.fn>

    beforeEach(() => {
      deserializeExtrinsics = vi.fn()
      mockApi = {
        deserializeExtrinsics
      } as unknown as IPolkadotApi<unknown, unknown, unknown>
    })

    it('should call transfer_keep_alive when not sending entire balance', async () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'NEURO', amount: 123n },
        address: '5F3sa2TYSF9Kxxxxx',
        balance: 999n,
        isAmountAll: false
      } as TTransferLocalOptions<unknown, unknown, unknown>

      await chain.transferLocalNativeAsset(mockOptions)

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
      } as TTransferLocalOptions<unknown, unknown, unknown>

      await chain.transferLocalNativeAsset(mockOptions)

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
    let mockApi: IPolkadotApi<unknown, unknown, unknown>
    let deserializeExtrinsics: ReturnType<typeof vi.fn>

    beforeEach(() => {
      deserializeExtrinsics = vi.fn()
      mockApi = {
        deserializeExtrinsics
      } as unknown as IPolkadotApi<unknown, unknown, unknown>
    })

    it('should call Assets.transfer with asset amount when not sending entire balance', () => {
      const mockOptions = {
        api: mockApi,
        assetInfo: { symbol: 'USDT', assetId: '42', amount: 321n },
        address: '5CLocalDest',
        balance: 999n,
        isAmountAll: false
      } as TTransferLocalOptions<unknown, unknown, unknown>

      chain.transferLocalNonNativeAsset(mockOptions)

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
      } as TTransferLocalOptions<unknown, unknown, unknown>

      const result = chain.transferLocalNonNativeAsset(mockOptions)

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
