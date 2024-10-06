import type { ApiPromise } from '@polkadot/api'
import type { TNode, TDestination } from '../../types'
import {
  BatchMode,
  type TRelayToParaOptions,
  type TSendOptions,
  type Extrinsic,
  type TBatchOptions
} from '../../types'
import { createApiInstanceForNode, determineRelayChain } from '../../utils'

type TOptions = TSendOptions | TRelayToParaOptions

type TTransaction = {
  func: (options: TOptions) => Promise<Extrinsic>
  options: TOptions
}

class BatchTransactionManager {
  private transactions: TTransaction[] = []

  addTransaction(transaction: TTransaction) {
    this.transactions.push(transaction)
  }

  isEmpty() {
    return this.transactions.length === 0
  }

  async buildBatch(
    api: ApiPromise | undefined,
    from: TNode | undefined,
    to: TDestination | undefined,
    options: TBatchOptions = { mode: BatchMode.BATCH_ALL }
  ): Promise<Extrinsic> {
    if (!from && !to) {
      throw new Error('From or to node is required')
    }
    if (to && typeof to === 'object') {
      throw new Error('Please provide ApiPromise instance.')
    }
    const apiWithFallback =
      api ?? (await createApiInstanceForNode(from ?? determineRelayChain(to as TNode)))

    const { mode } = options
    if (this.transactions.length === 0) {
      throw new Error('No transactions to batch.')
    }

    const sameFrom = this.transactions.every(tx => {
      if ('origin' in tx.options) {
        return tx.options.origin === from
      }
      return true
    })

    if (!sameFrom) {
      throw new Error('All transactions must have the same origin.')
    }

    const results = this.transactions.map(options => {
      const { func, options: txOptions } = options
      return func(txOptions)
    })
    const txs = await Promise.all(results)
    return mode === BatchMode.BATCH_ALL
      ? apiWithFallback.tx.utility.batchAll(txs)
      : apiWithFallback.tx.utility.batch(txs)
  }
}

export default BatchTransactionManager
