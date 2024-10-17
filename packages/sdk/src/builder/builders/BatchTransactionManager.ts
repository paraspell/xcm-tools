import type { IPolkadotApi } from '../../api/IPolkadotApi'
import type { TNode, TDestination } from '../../types'
import {
  BatchMode,
  type TRelayToParaOptions,
  type TSendOptions,
  type TBatchOptions
} from '../../types'
import { determineRelayChain } from '../../utils'

type TOptions<TApi, TRes> = TSendOptions<TApi, TRes> | TRelayToParaOptions<TApi, TRes>

type TTransaction<TApi, TRes> = {
  func: (options: TOptions<TApi, TRes>) => Promise<TRes>
  options: TOptions<TApi, TRes>
}

class BatchTransactionManager<TApi, TRes> {
  private transactions: TTransaction<TApi, TRes>[] = []

  addTransaction(transaction: TTransaction<TApi, TRes>) {
    this.transactions.push(transaction)
  }

  isEmpty() {
    return this.transactions.length === 0
  }

  async buildBatch(
    api: IPolkadotApi<TApi, TRes>,
    from: TNode | undefined,
    to: TDestination | undefined,
    options: TBatchOptions = { mode: BatchMode.BATCH_ALL }
  ): Promise<TRes> {
    if (!from && !to) {
      throw new Error('From or to node is required')
    }
    if (to && typeof to === 'object') {
      throw new Error('Please provide Api instance.')
    }

    await api.init(from ?? determineRelayChain(to as TNode))

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

    return api.callTxMethod({
      module: 'Utility',
      section: mode === BatchMode.BATCH_ALL ? 'batch_all' : 'batch',
      parameters: { data: [txs] }
    })
  }
}

export default BatchTransactionManager
