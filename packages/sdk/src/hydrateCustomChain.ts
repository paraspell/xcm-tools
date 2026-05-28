import type { TChain, TChainAssetsInfo } from '@paraspell/sdk-core'
import { CustomChainInvalidError, type TCustomChainInput } from '@paraspell/sdk-core'

import PapiApi from './PapiApi'

export const hydrateCustomChain = async (
  name: string,
  input: TCustomChainInput
): Promise<TChainAssetsInfo> => {
  const api = new PapiApi({ customChains: { [name]: input } })
  try {
    // TODO: drop the cast once PapiApi propagates a TCustomChain generic
    await api.init(name as TChain)
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
