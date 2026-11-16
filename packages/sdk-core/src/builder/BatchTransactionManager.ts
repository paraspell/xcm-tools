import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../api/PolkadotApi'
import { TX_CLIENT_TIMEOUT_MS } from '../constants'
import { BatchValidationError } from '../errors'
import type { TBatchedTransferOptions } from '../types'
import { BatchMode, type TBatchOptions } from '../types'
import { assertSubstrateOrigin, createTransferOrSwap } from '../utils'
import { normalizeAmountAll } from './normalizeAmountAll'

class BatchTransactionManager<TApi, TRes, TSigner, TCustomChain extends string = never> {
  transactionOptions: TBatchedTransferOptions<TApi, TRes, TSigner, TCustomChain>[] = []

  addTransaction(options: TBatchedTransferOptions<TApi, TRes, TSigner, TCustomChain>) {
    this.transactionOptions.push(options)
  }

  isEmpty() {
    return this.transactionOptions.length === 0
  }

  async buildBatch(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
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
        const res = await normalizeAmountAll(api, builder, opts)
        return { ...res, builder }
      })
    )

    const txs = await Promise.all(
      normalized.map(async ({ options: txOptions, builder }) => {
        const { from: origin } = txOptions
        assertSubstrateOrigin(origin)
        const substrateOptions = { ...txOptions, from: origin }
        const tx = await createTransferOrSwap(substrateOptions)
        await builder.maybePerformXcmFormatCheck(tx, substrateOptions, false)
        return tx
      })
    )

    return api.callBatchMethod(txs, mode)
  }
}

export default BatchTransactionManager
