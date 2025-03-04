import type { TDryRunOptions, TDryRunResult } from '../types'
import { validateAddress } from '../utils'

export const getDryRun = async <TApi, TRes>(
  options: TDryRunOptions<TApi, TRes>
): Promise<TDryRunResult> => {
  const { api, node, address } = options

  validateAddress(address, node, false)

  await api.init(node)
  try {
    return await api.getDryRun(options)
  } finally {
    await api.disconnect()
  }
}
