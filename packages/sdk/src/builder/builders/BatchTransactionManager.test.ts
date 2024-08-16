import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ApiPromise } from '@polkadot/api'
import BatchTransactionManager from './BatchTransactionManager'
import { BatchMode, TSendOptions } from '../../types'

const mockSendTransaction = vi.fn()
const batchMock = vi.fn()
const batchAllMock = vi.fn()

const mockApiPromise = {
  tx: {
    utility: {
      batch: batchMock,
      batchAll: batchAllMock
    }
  }
} as unknown as ApiPromise

describe('BatchTransactionManager', () => {
  beforeEach(() => {
    mockSendTransaction.mockClear()
    batchMock.mockClear()
    batchAllMock.mockClear()
  })

  describe('addTransaction', () => {
    it('adds a transaction to the manager', () => {
      const manager = new BatchTransactionManager()
      expect(manager.isEmpty()).toBe(true)
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Acala' } as TSendOptions
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
        options: { origin: 'Acala' } as TSendOptions
      })
      expect(manager.isEmpty()).toBe(false)
    })
  })

  describe('buildBatch', () => {
    it('throws an error if there are no transactions', async () => {
      const manager = new BatchTransactionManager()
      await expect(
        manager.buildBatch(mockApiPromise, 'Acala', undefined, { mode: BatchMode.BATCH_ALL })
      ).rejects.toThrow('No transactions to batch.')
    })

    it('calls sendTransaction for each added transaction and batches them with batchAll', async () => {
      const manager = new BatchTransactionManager()
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Acala' } as TSendOptions
      })
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Acala' } as TSendOptions
      })
      mockSendTransaction.mockResolvedValue({ hash: 'hash' })

      await manager.buildBatch(mockApiPromise, 'Acala', undefined, { mode: BatchMode.BATCH_ALL })

      expect(mockSendTransaction).toHaveBeenCalledTimes(2)
      expect(batchAllMock).toHaveBeenCalled()
    })

    it('uses batch when BATCH mode is selected', async () => {
      const manager = new BatchTransactionManager()
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Acala' } as TSendOptions
      })
      mockSendTransaction.mockResolvedValue({ hash: 'hash' })

      await manager.buildBatch(mockApiPromise, 'Acala', undefined, { mode: BatchMode.BATCH })

      expect(batchMock).toHaveBeenCalled()
    })

    it('uses batchAll when BATCH_ALL mode is selected', async () => {
      const manager = new BatchTransactionManager()
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Acala' } as TSendOptions
      })
      mockSendTransaction.mockResolvedValue({ hash: 'hash' })

      await manager.buildBatch(mockApiPromise, 'Acala', undefined, { mode: BatchMode.BATCH_ALL })

      expect(batchAllMock).toHaveBeenCalled()
    })

    it('should fail if different origins are used', async () => {
      const manager = new BatchTransactionManager()
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Acala' } as TSendOptions
      })
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Karura' } as TSendOptions
      })
      mockSendTransaction.mockResolvedValue({ hash: 'hash' })

      await expect(
        manager.buildBatch(mockApiPromise, 'Acala', undefined, { mode: BatchMode.BATCH_ALL })
      ).rejects.toThrow('All transactions must have the same origin.')
    })

    it('should fail if no from or to node is provided', async () => {
      const manager = new BatchTransactionManager()
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Acala' } as TSendOptions
      })
      mockSendTransaction.mockResolvedValue({ hash: 'hash' })

      await expect(manager.buildBatch(mockApiPromise, undefined, undefined)).rejects.toThrow(
        'From or to node is required'
      )
    })

    it('should fail if to is an object', async () => {
      const manager = new BatchTransactionManager()
      manager.addTransaction({
        func: mockSendTransaction,
        options: { origin: 'Acala' } as TSendOptions
      })
      mockSendTransaction.mockResolvedValue({ hash: 'hash' })

      await expect(
        manager.buildBatch(mockApiPromise, 'Acala', { parents: 1, interior: 'Here' })
      ).rejects.toThrow('Please provide ApiPromise instance.')
    })
  })
})
