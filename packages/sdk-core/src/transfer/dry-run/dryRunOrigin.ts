import { getNativeAssetSymbol } from '@paraspell/assets'

import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import type { TDryRunCallOptions, TDryRunChainResult } from '../../types'
import { validateAddress } from '../../utils'

export const dryRunOrigin = async <TApi, TRes>(
  options: TDryRunCallOptions<TApi, TRes>
): Promise<TDryRunChainResult> => {
  const { api, chain, address } = options

  validateAddress(api, address, chain, false)

  await api.init(chain, DRY_RUN_CLIENT_TIMEOUT_MS)
  try {
    const result = await api.getDryRunCall(options)
    if (result.success) {
      return {
        ...result,
        currency: getNativeAssetSymbol(chain)
      }
    } else {
      return result
    }
  } finally {
    await api.disconnect()
  }
}
