import type { TDryRunOptions, TDryRunResult } from '../types'

export const getDryRun = async <TApi, TRes>(
  options: TDryRunOptions<TApi, TRes>
): Promise<TDryRunResult> => {
  const { api, node } = options

  await api.init(node)
  try {
    return await api.getDryRun(options)
  } finally {
    await api.disconnect()
  }
}
