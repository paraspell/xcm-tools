import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import type { TDryRunOptions, TDryRunResult } from '../../types'
import { validateAddress } from '../../utils'
import { dryRunInternal } from './dryRunInternal'

export const dryRun = async <TApi, TRes, TSigner>(
  options: TDryRunOptions<TApi, TRes, TSigner>
): Promise<TDryRunResult> => {
  const { api, senderAddress, origin } = options

  validateAddress(api, senderAddress, origin, false)

  await api.init(origin, DRY_RUN_CLIENT_TIMEOUT_MS)
  try {
    return await dryRunInternal(options)
  } finally {
    await api.disconnect()
  }
}
