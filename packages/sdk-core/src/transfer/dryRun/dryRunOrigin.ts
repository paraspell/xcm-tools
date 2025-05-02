import { getNativeAssetSymbol } from '@paraspell/assets'

import type { TDryRunCallOptions, TDryRunNodeResult } from '../../types'
import { validateAddress } from '../../utils'

export const dryRunOrigin = async <TApi, TRes>(
  options: TDryRunCallOptions<TApi, TRes>
): Promise<TDryRunNodeResult> => {
  const { api, node, address } = options

  validateAddress(address, node, false)

  await api.init(node)
  try {
    const result = await api.getDryRunCall(options)
    if (result.success) {
      return {
        ...result,
        currency: getNativeAssetSymbol(node)
      }
    } else {
      return result
    }
  } finally {
    await api.disconnect()
  }
}
