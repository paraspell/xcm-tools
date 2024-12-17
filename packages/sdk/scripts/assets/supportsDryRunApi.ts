import type { TPjsApi } from '../../src/pjs'

export const supportsDryRunApi = (api: TPjsApi) => {
  return api.call.dryRunApi !== undefined
}
