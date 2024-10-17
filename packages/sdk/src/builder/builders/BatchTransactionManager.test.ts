import { describe, it, expect, beforeEach, vi } from 'vitest'
import BatchTransactionManager from './BatchTransactionManager'
import type { TSendOptions } from '../../types'
import { BatchMode } from '../../types'
import type { ApiPromise } from '@polkadot/api'
import type { IPolkadotApi } from '../../api/IPolkadotApi'
import type { Extrinsic } from '../../pjs/types'

const mockSendTransaction = vi.fn()

const mockApi = {
  init: vi.fn(),
  callTxMethod: vi.fn()
} as unknown as IPolkadotApi<ApiPromise, Extrinsic>

describe('BatchTransactionManager', () => {
  beforeEach(() => {
    mockSendTransaction.mockClear()
  })

  describe('addTransaction', () => {
    it('adds a transaction to the manager', () => {
      const manager = new BatchTransactionManager()
      expect(manager.isEmpty()).toBe(true)
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Acala' } as TSendOptions<ApiPromise, Extrinsic>
      })
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
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Acala' } as TSendOptions<ApiPromise, Extrinsic>
      })
      expect(manager.isEmpty()).toBe(false)
    })
  })

  describe('buildBatch', () => {
    it('throws an error if there are no transactions', async () => {
      const manager = new BatchTransactionManager()
      await expect(
        manager.buildBatch(mockApi, 'Acala', undefined, { mode: BatchMode.BATCH_ALL })
      ).rejects.toThrow('No transactions to batch.')
    })

    it('calls sendTransaction for each added transaction and batches them with batchAll', async () => {
      const spy = vi.spyOn(mockApi, 'callTxMethod')

      const manager = new BatchTransactionManager()
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Acala' } as TSendOptions<ApiPromise, Extrinsic>
      })
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Acala' } as TSendOptions<ApiPromise, Extrinsic>
      })
      mockSendTransaction.mockResolvedValue({ hash: 'hash' })

      await manager.buildBatch(mockApi, 'Acala', undefined, { mode: BatchMode.BATCH_ALL })

      expect(mockSendTransaction).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalled()
    })

    it('uses batch when BATCH mode is selected', async () => {
      const spy = vi.spyOn(mockApi, 'callTxMethod')
      const manager = new BatchTransactionManager()
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Acala' } as TSendOptions<ApiPromise, Extrinsic>
      })
      mockSendTransaction.mockResolvedValue({ hash: 'hash' })

      await manager.buildBatch(mockApi, 'Acala', undefined, { mode: BatchMode.BATCH })

      expect(spy).toHaveBeenCalled()
    })

    it('uses batchAll when BATCH_ALL mode is selected', async () => {
      const spy = vi.spyOn(mockApi, 'callTxMethod')
      const manager = new BatchTransactionManager()
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Acala' } as TSendOptions<ApiPromise, Extrinsic>
      })
      mockSendTransaction.mockResolvedValue({ hash: 'hash' })

      await manager.buildBatch(mockApi, 'Acala', undefined, { mode: BatchMode.BATCH_ALL })

      expect(spy).toHaveBeenCalled()
    })

    it('should fail if different origins are used', async () => {
      const manager = new BatchTransactionManager()
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Acala' } as TSendOptions<ApiPromise, Extrinsic>
      })
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Karura' } as TSendOptions<ApiPromise, Extrinsic>
      })
      mockSendTransaction.mockResolvedValue({ hash: 'hash' })

      await expect(
        manager.buildBatch(mockApi, 'Acala', undefined, { mode: BatchMode.BATCH_ALL })
      ).rejects.toThrow('All transactions must have the same origin.')
    })

    it('should fail if no from or to node is provided', async () => {
      const manager = new BatchTransactionManager()
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Acala' } as TSendOptions<ApiPromise, Extrinsic>
      })
      mockSendTransaction.mockResolvedValue({ hash: 'hash' })

      await expect(manager.buildBatch(mockApi, undefined, undefined)).rejects.toThrow(
        'From or to node is required'
      )
    })

    it('should fail if to is an object', async () => {
      const manager = new BatchTransactionManager()
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Acala' } as TSendOptions<ApiPromise, Extrinsic>
      })
      mockSendTransaction.mockResolvedValue({ hash: 'hash' })

      await expect(
        manager.buildBatch(mockApi, 'Acala', { parents: 1, interior: 'Here' })
      ).rejects.toThrow('Please provide Api instance.')
    })
  })
})
