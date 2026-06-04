import type { TChainAssetsInfo } from '@paraspell/sdk-core'
import { CustomChainInvalidError, type TCustomChainInput } from '@paraspell/sdk-core'

import PapiApi from './PapiApi'

export const hydrateCustomChain = async <TCustomChain extends string>(
  name: TCustomChain,
  input: TCustomChainInput
): Promise<TChainAssetsInfo> => {
  const api = new PapiApi<TCustomChain>({ customChains: { [name]: input } })
  try {
    await api.init(name)
    const info = api._customCtx.customChainAssets?.[name]
    if (!info) {
      throw new CustomChainInvalidError(
        `Custom chain '${name}' could not be hydrated from its providers.`
      )
    }
    return info
  } finally {
    await api.disconnect()
  }
}
