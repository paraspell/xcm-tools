import type { IPolkadotApi } from '../api'

export const getBridgeStatus = async <TApi, TRes, TSigner>(
  api: IPolkadotApi<TApi, TRes, TSigner>
) => {
  await api.init('BridgeHubPolkadot')
  try {
    return await api.getBridgeStatus()
  } finally {
    await api.disconnect()
  }
}
