import type { PolkadotApi } from '../api/PolkadotApi'
import { DryRunFailedError } from '../errors'
import type { TSubstrateTransferBaseOptions } from '../types'
import { assertSender, isConfig } from '../utils'
import { buildDryRun } from './buildDryRun'

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
) => {
  const { sender } = options

  const { config } = api
  if (isConfig(config) && config.xcmFormatCheck && !isCalledInternally) {
    assertSender(sender)
    const dryRunResult = await buildDryRun(
      api,
      tx,
      {
        ...options,
        sender
      },
      {
        sentAssetMintMode: 'bypass'
      }
    )

    if (dryRunResult.dryRunError) {
      throw new DryRunFailedError(dryRunResult.dryRunError, 'XCM format check failed.')
    }
  }
}
