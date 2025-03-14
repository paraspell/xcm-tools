import type { ApiPromise } from '@polkadot/api'

export const supportsDryRunApi = (api: ApiPromise) => {
  return api.call.dryRunApi !== undefined
}
