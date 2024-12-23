import { describe, it, expect, beforeEach, vi } from 'vitest'
import BatchTransactionManager from './BatchTransactionManager'
import type { TSendOptions } from '../types'
import { BatchMode } from '../types'
import type { ApiPromise } from '@polkadot/api'
import type { IPolkadotApi } from '../api/IPolkadotApi'
import type { Extrinsic } from '../pjs/types'
import { send } from '../pallets/xcmPallet'

vi.mock('../pallets/xcmPallet/transfer', () => ({
  send: vi.fn()
}))

const mockApi = {
  init: vi.fn(),
  callTxMethod: vi.fn()
} as unknown as IPolkadotApi<ApiPromise, Extrinsic>

describe('BatchTransactionManager', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('addTransaction', () => {
    it('adds a transaction to the manager', () => {
      const manager = new BatchTransactionManager()
      expect(manager.isEmpty()).toBe(true)
      manager.addTransaction({ origin: 'Acala' } as TSendOptions<ApiPromise, Extrinsic>)
      expect(manager.isEmpty()).toBe(false)
    })
  })

  describe('isEmpty', () => {
    it('returns true when no transactions have been added', () => {
      const manager = new BatchTransactionManager()
      expect(manager.isEmpty()).toBe(true)
    })

    it('returns false when transactions are present', () => {
      const manager = new BatchTransactionManager()
      manager.addTransaction({ origin: 'Acala' } as TSendOptions<ApiPromise, Extrinsic>)
      expect(manager.isEmpty()).toBe(false)
    })
  })

  describe('buildBatch', () => {
    it('throws an error if there are no transactions', async () => {
      const manager = new BatchTransactionManager()
      await expect(
        manager.buildBatch(mockApi, 'Acala', { mode: BatchMode.BATCH_ALL })
      ).rejects.toThrow('No transactions to batch.')
    })

    it('calls sendTransaction for each added transaction and batches them with batchAll', async () => {
      const manager = new BatchTransactionManager()
      manager.addTransaction({ origin: 'Acala' } as TSendOptions<ApiPromise, Extrinsic>)
      manager.addTransaction({ origin: 'Acala' } as TSendOptions<ApiPromise, Extrinsic>)
      vi.mocked(send).mockResolvedValue({ hash: 'hash' })

      await manager.buildBatch(mockApi, 'Acala', { mode: BatchMode.BATCH_ALL })
      expect(send).toHaveBeenCalledTimes(2)
    })

    it('uses batch when BATCH mode is selected', async () => {
      const spy = vi.spyOn(mockApi, 'callTxMethod')
      const manager = new BatchTransactionManager()
      manager.addTransaction({ origin: 'Acala' } as TSendOptions<ApiPromise, Extrinsic>)
      vi.mocked(send).mockResolvedValue({ hash: 'hash' })

      await manager.buildBatch(mockApi, 'Acala', { mode: BatchMode.BATCH })

      expect(spy).toHaveBeenCalled()
    })

    it('uses batchAll when BATCH_ALL mode is selected', async () => {
      const manager = new BatchTransactionManager()
      manager.addTransaction({
        origin: 'Acala',
        currency: {
          symbol: 'ACA',
          amount: 100
        }
      } as TSendOptions<ApiPromise, Extrinsic>)
      vi.mocked(send).mockResolvedValue({ hash: 'hash' })

      await manager.buildBatch(mockApi, 'Acala', { mode: BatchMode.BATCH_ALL })

      expect(send).toHaveBeenCalled()
    })

    it('should fail if different origins are used', async () => {
      const manager = new BatchTransactionManager()
      manager.addTransaction({ origin: 'Acala' } as TSendOptions<ApiPromise, Extrinsic>)
      manager.addTransaction({ origin: 'Karura' } as TSendOptions<ApiPromise, Extrinsic>)
      vi.mocked(send).mockResolvedValue({ hash: 'hash' })

      await expect(
        manager.buildBatch(mockApi, 'Acala', { mode: BatchMode.BATCH_ALL })
      ).rejects.toThrow('All transactions must have the same origin.')
    })
  })
})
