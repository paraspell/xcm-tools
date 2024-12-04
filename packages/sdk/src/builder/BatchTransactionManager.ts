import type { IPolkadotApi } from '../api/IPolkadotApi'
import { send } from '../pallets/xcmPallet/transfer'
import type { TNodeDotKsmWithRelayChains, TSendOptions } from '../types'
import { BatchMode, type TBatchOptions } from '../types'

class BatchTransactionManager<TApi, TRes> {
  private transactionOptions: TSendOptions<TApi, TRes>[] = []

  addTransaction(options: TSendOptions<TApi, TRes>) {
    this.transactionOptions.push(options)
  }

  isEmpty() {
    return this.transactionOptions.length === 0
  }

  async buildBatch(
    api: IPolkadotApi<TApi, TRes>,
    from: TNodeDotKsmWithRelayChains,
    options: TBatchOptions = { mode: BatchMode.BATCH_ALL }
  ): Promise<TRes> {
    await api.init(from)

    const { mode } = options
    if (this.transactionOptions.length === 0) {
      throw new Error('No transactions to batch.')
    }

    const sameFrom = this.transactionOptions.every(tx => tx.origin === from)

    if (!sameFrom) {
      throw new Error('All transactions must have the same origin.')
    }

    const results = this.transactionOptions.map(options => send(options))
    const txs = await Promise.all(results)

    return api.callTxMethod({
      module: 'Utility',
      section: mode === BatchMode.BATCH_ALL ? 'batch_all' : 'batch',
      parameters: { data: [txs] }
    })
  }
}

export default BatchTransactionManager
