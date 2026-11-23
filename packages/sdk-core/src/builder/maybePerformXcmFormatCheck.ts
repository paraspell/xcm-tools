import type { PolkadotApi } from '../api'
import { DryRunFailedError } from '../errors'
import type { TSubstrateTransferBaseOptions } from '../types'
import { assertSender, isConfig } from '../utils'
import { buildDryRun } from './buildDryRun'

/**
 * Performs the dry run promised by the `xcmFormatCheck` builder option on a single built
 * transaction and throws a {@link DryRunFailedError} when that dry run reports a failure.
 *
 * Both the single build flow (`Builder.build()`) and the batch flow
 * (`Builder.buildBatch()`) call this helper, so the option is honoured on either path.
 * The dry run uses the `bypass` mint mode, which is what lets the message be checked
 * before the sender actually holds the transferred assets.
 *
 * @param api - The Polkadot API instance holding the builder config.
 * @param tx - The built transaction to dry run.
 * @param options - The normalized options the transaction was built from.
 * @param isCalledInternally - The Builder acts as an internal helper of a different call.
 */
export const maybePerformXcmFormatCheck = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  tx: TRes,
  options: TSubstrateTransferBaseOptions<TApi, TRes, TSigner>,
  isCalledInternally = false
): Promise<void> => {
  const { sender } = options

  const { config } = api
  if (!isConfig(config) || !config.xcmFormatCheck || isCalledInternally) return

  assertSender(sender)

  const dryRunResult = await buildDryRun(
    api.clone(),
    tx,
    { ...options, sender },
    {
      sentAssetMintMode: 'bypass'
    }
  )

  if (dryRunResult.dryRunError) {
    throw new DryRunFailedError(dryRunResult.dryRunError, 'XCM format check failed.')
  }
}
