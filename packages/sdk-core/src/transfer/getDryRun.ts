import type { TDryRunCallOptions, TDryRunResult } from '../types'
import { validateAddress } from '../utils'

export const getDryRun = async <TApi, TRes>(
  options: TDryRunCallOptions<TApi, TRes>
): Promise<TDryRunResult> => {
  const { api, node, address } = options

  validateAddress(address, node, false)

  await api.init(node)
  try {
    return await api.getDryRunCall(options)
  } finally {
    await api.disconnect()
  }
}
