import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api/IPolkadotApi'
import { TX_CLIENT_TIMEOUT_MS } from '../constants'
import { InvalidParameterError } from '../errors'
import { send } from '../transfer'
import type { TBatchedSendOptions } from '../types'
import { BatchMode, type TBatchOptions } from '../types'
import { normalizeAmountAll } from './normalizeAmountAll'

class BatchTransactionManager<TApi, TRes> {
  transactionOptions: TBatchedSendOptions<TApi, TRes>[] = []

  addTransaction(options: TBatchedSendOptions<TApi, TRes>) {
    this.transactionOptions.push(options)
  }

  isEmpty() {
    return this.transactionOptions.length === 0
  }

  async buildBatch(
    api: IPolkadotApi<TApi, TRes>,
    from: TSubstrateChain,
    options: TBatchOptions = { mode: BatchMode.BATCH_ALL }
  ): Promise<TRes> {
    await api.init(from, TX_CLIENT_TIMEOUT_MS)

    const { mode } = options
    if (this.transactionOptions.length === 0) {
      throw new InvalidParameterError('No transactions to batch.')
    }

    const sameFrom = this.transactionOptions.every(tx => tx.from === from)

    if (!sameFrom) {
      throw new InvalidParameterError('All transactions must have the same origin.')
    }

    const normalized = await Promise.all(
      this.transactionOptions.map(async opts => {
        const { builder } = opts
        return normalizeAmountAll(api, builder, opts)
      })
    )

    const txs = await Promise.all(normalized.map(({ options }) => send(options)))

    return api.callBatchMethod(txs, mode)
  }
}

export default BatchTransactionManager
