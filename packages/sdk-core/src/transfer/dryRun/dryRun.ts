import type { TDryRunOptions, TDryRunResult } from '../../types'
import { validateAddress } from '../../utils'
import { dryRunInternal } from './dryRunInternal'

export const dryRun = async <TApi, TRes>(
  options: TDryRunOptions<TApi, TRes>
): Promise<TDryRunResult> => {
  const { api, senderAddress, origin } = options

  validateAddress(senderAddress, origin, false)

  await api.init(origin)
  try {
    return await dryRunInternal(options)
  } finally {
    await api.disconnect()
  }
}
