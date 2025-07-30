import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../api/IPolkadotApi'
import { TX_CLIENT_TIMEOUT_MS } from '../constants'
import { InvalidParameterError } from '../errors'
import { send } from '../transfer'
import type { TSendOptions } from '../types'
import { BatchMode, type TBatchOptions } from '../types'

class BatchTransactionManager<TApi, TRes> {
  transactionOptions: TSendOptions<TApi, TRes>[] = []

  addTransaction(options: TSendOptions<TApi, TRes>) {
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

    const results = this.transactionOptions.map(options => send(options))
    const txs = await Promise.all(results)

    return api.callBatchMethod(txs, mode)
  }
}

export default BatchTransactionManager
