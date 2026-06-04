import type { PolkadotApi } from '../api'

export const getBridgeStatus = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>
) => {
  await api.init('BridgeHubPolkadot')
  try {
    return await api.getBridgeStatus()
  } finally {
    await api.disconnect()
  }
}
