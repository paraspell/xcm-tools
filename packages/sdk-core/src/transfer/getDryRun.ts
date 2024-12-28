import type { TDryRunOptions, TDryRunResult } from '../types'

export const getDryRun = async <TApi, TRes>(
  options: TDryRunOptions<TApi, TRes>
): Promise<TDryRunResult> => {
  const { api, node } = options

  if (node === 'Kusama') {
    throw new Error('Kusama is temporarily disable due to unknown error in DryRun.')
  }

  await api.init(node)
  try {
    return await api.getDryRun(options)
  } finally {
    await api.disconnect()
  }
}
