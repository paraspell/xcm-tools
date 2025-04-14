import type { IPolkadotApi } from '../api'

export const getBridgeStatus = async <TApi, TRes>(api: IPolkadotApi<TApi, TRes>) => {
  await api.init('BridgeHubPolkadot')
  try {
    return await api.getBridgeStatus()
  } finally {
    await api.disconnect()
  }
}
