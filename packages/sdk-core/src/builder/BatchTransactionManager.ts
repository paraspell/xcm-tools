import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../api/PolkadotApi'
import { TX_CLIENT_TIMEOUT_MS } from '../constants'
import { BatchValidationError } from '../errors'
import type { TBatchedTransferOptions } from '../types'
import { BatchMode, type TBatchOptions } from '../types'
import { assertSubstrateOrigin, createTransferOrSwap } from '../utils'
import { normalizeAmountAll } from './normalizeAmountAll'

class BatchTransactionManager<TApi, TRes, TSigner> {
  transactionOptions: TBatchedTransferOptions<TApi, TRes, TSigner>[] = []

  addTransaction(options: TBatchedTransferOptions<TApi, TRes, TSigner>) {
    this.transactionOptions.push(options)
  }

  isEmpty() {
    return this.transactionOptions.length === 0
  }

  async buildBatch(
    api: PolkadotApi<TApi, TRes, TSigner>,
    from: TSubstrateChain,
    options: TBatchOptions = { mode: BatchMode.BATCH_ALL }
  ): Promise<TRes> {
    await api.init(from, TX_CLIENT_TIMEOUT_MS)

    const { mode } = options
    if (this.transactionOptions.length === 0) {
      throw new BatchValidationError('No transactions to batch.')
    }

    const sameFrom = this.transactionOptions.every(tx => tx.from === from)

    if (!sameFrom) {
      throw new BatchValidationError('All transactions must have the same origin.')
    }

    const normalized = await Promise.all(
      this.transactionOptions.map(async opts => {
        const { builder } = opts
        return normalizeAmountAll(api, builder, opts)
      })
    )

    const txs = await Promise.all(
      normalized.map(({ options }) => {
        const { from: origin } = options
        assertSubstrateOrigin(origin)
        return createTransferOrSwap({ ...options, from: origin })
      })
    )

    return api.callBatchMethod(txs, mode)
  }
}

export default BatchTransactionManager
