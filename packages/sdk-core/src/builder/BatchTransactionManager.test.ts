import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PolkadotApi } from '../api/PolkadotApi'
import type { TBatchedTransferOptions, TTransferBaseOptions } from '../types'
import { BatchMode } from '../types'
import { createTransferOrSwap } from '../utils'
import BatchTransactionManager from './BatchTransactionManager'
import type { GeneralBuilder } from './Builder'
import { maybePerformXcmFormatCheck } from './maybePerformXcmFormatCheck'

vi.mock('../utils')
vi.mock('./maybePerformXcmFormatCheck')

const mockApi = {
  init: vi.fn(),
  getApi: vi.fn(),
  callBatchMethod: vi.fn()
} as unknown as PolkadotApi<unknown, unknown, unknown>

const createBuilder = () =>
  ({
    createTxFactory: vi.fn(() => vi.fn())
  }) as unknown as GeneralBuilder<
    unknown,
    unknown,
    unknown,
    TTransferBaseOptions<unknown, unknown, unknown>
  >

const createTransferOptions = (
  overrides: Partial<TBatchedTransferOptions<unknown, unknown, unknown>> = {}
): TBatchedTransferOptions<unknown, unknown, unknown> => ({
  from: 'Acala',
  api: mockApi,
  to: 'Hydration',
  currency: { symbol: 'ACA', amount: 100 },
  recipient: 'address',
  builder: createBuilder(),
  ...overrides
})

describe('BatchTransactionManager', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('addTransaction', () => {
    it('adds a transaction to the manager', () => {
      const manager = new BatchTransactionManager()
      expect(manager.isEmpty()).toBe(true)
      manager.addTransaction(createTransferOptions())
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
      manager.addTransaction(createTransferOptions())
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
      manager.addTransaction(createTransferOptions())
      manager.addTransaction(createTransferOptions())
      vi.mocked(createTransferOrSwap).mockResolvedValue({ hash: 'hash' })

      await manager.buildBatch(mockApi, 'Acala', { mode: BatchMode.BATCH_ALL })
      expect(createTransferOrSwap).toHaveBeenCalledTimes(2)
    })

    it('uses batch when BATCH mode is selected', async () => {
      const spy = vi.spyOn(mockApi, 'callBatchMethod')
      const manager = new BatchTransactionManager()
      manager.addTransaction(createTransferOptions())
      vi.mocked(createTransferOrSwap).mockResolvedValue({ hash: 'hash' })

      await manager.buildBatch(mockApi, 'Acala', { mode: BatchMode.BATCH })

      expect(spy).toHaveBeenCalled()
    })

    it('uses batchAll when BATCH_ALL mode is selected', async () => {
      const manager = new BatchTransactionManager()
      manager.addTransaction(createTransferOptions())
      vi.mocked(createTransferOrSwap).mockResolvedValue({ hash: 'hash' })

      await manager.buildBatch(mockApi, 'Acala', { mode: BatchMode.BATCH_ALL })

      expect(createTransferOrSwap).toHaveBeenCalled()
    })

    it('should fail if different origins are used', async () => {
      const manager = new BatchTransactionManager()
      manager.addTransaction(createTransferOptions())
      manager.addTransaction(createTransferOptions({ from: 'Karura' }))
      vi.mocked(createTransferOrSwap).mockResolvedValue({ hash: 'hash' })

      await expect(
        manager.buildBatch(mockApi, 'Acala', { mode: BatchMode.BATCH_ALL })
      ).rejects.toThrow('All transactions must have the same origin.')
    })

    it('calls maybePerformXcmFormatCheck for each transaction in the batch', async () => {
      const manager = new BatchTransactionManager()
      manager.addTransaction(createTransferOptions())
      manager.addTransaction(createTransferOptions())
      const mockTx = { hash: 'hash' }
      vi.mocked(createTransferOrSwap).mockResolvedValue(mockTx)

      await manager.buildBatch(mockApi, 'Acala', { mode: BatchMode.BATCH_ALL })

      expect(maybePerformXcmFormatCheck).toHaveBeenCalledTimes(2)
      expect(maybePerformXcmFormatCheck).toHaveBeenCalledWith(
        mockApi,
        mockTx,
        expect.objectContaining({ from: 'Acala', to: 'Hydration' })
      )
    })

    it('propagates error when maybePerformXcmFormatCheck fails', async () => {
      const spy = vi.spyOn(mockApi, 'callBatchMethod')
      const manager = new BatchTransactionManager()
      manager.addTransaction(createTransferOptions())
      vi.mocked(createTransferOrSwap).mockResolvedValue({ hash: 'hash' })
      vi.mocked(maybePerformXcmFormatCheck).mockRejectedValueOnce(
        new Error('XCM format check failed.')
      )

      await expect(
        manager.buildBatch(mockApi, 'Acala', { mode: BatchMode.BATCH_ALL })
      ).rejects.toThrow('XCM format check failed.')

      expect(spy).not.toHaveBeenCalled()
    })
  })
})
