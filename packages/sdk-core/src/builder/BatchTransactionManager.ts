import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../api/PolkadotApi'
import { TX_CLIENT_TIMEOUT_MS } from '../constants'
import { BatchValidationError, DryRunFailedError } from '../errors'
import type { TBatchedTransferOptions, TTransferOptions } from '../types'
import { BatchMode, type TBatchOptions } from '../types'
import { assertSender, assertSubstrateOrigin, createTransferOrSwap } from '../utils'
import { isConfig } from '../utils/guards/isConfig'
import { buildDryRun } from './buildDryRun'
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

    await this.maybePerformXcmFormatChecks(api, normalized, txs)

    return api.callBatchMethod(txs, mode)
  }

  /**
   * Honors the `xcmFormatCheck` builder option for batched transfers.
   *
   * The single-transfer path in `Builder` dry-runs the built transaction before
   * returning it when `xcmFormatCheck` is enabled. The batch path previously
   * accepted the option without running any check, so batched calldata was
   * returned untested. Each batched transaction is now dry-run in the same way,
   * mirroring the single-transfer behavior.
   */
  private async maybePerformXcmFormatChecks(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    normalized: { options: TTransferOptions<TApi, TRes, TSigner, TCustomChain> }[],
    txs: TRes[]
  ) {
    const { config } = api

    if (!isConfig(config) || !config.xcmFormatCheck) return

    await Promise.all(
      normalized.map(async ({ options }, index) => {
        const { from, sender } = options
        assertSubstrateOrigin(from)
        assertSender(sender)

        const dryRunResult = await buildDryRun(
          api,
          txs[index],
          { ...options, from, sender },
          {
            sentAssetMintMode: 'bypass'
          }
        )

        if (dryRunResult.dryRunError) {
          throw new DryRunFailedError(dryRunResult.dryRunError, 'XCM format check failed.')
        }
      })
    )
  }
}

export default BatchTransactionManager
