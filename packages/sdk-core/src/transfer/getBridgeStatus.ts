import type { PolkadotApi } from '../api'

export const getBridgeStatus = async <TApi, TRes, TSigner>(
  api: PolkadotApi<TApi, TRes, TSigner>
) => {
  await api.init('BridgeHubPolkadot')
  try {
    return await api.getBridgeStatus()
  } finally {
    await api.disconnect()
  }
}
