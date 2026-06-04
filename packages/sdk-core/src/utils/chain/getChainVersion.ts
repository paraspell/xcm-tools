import {
  isCustomChain,
  isExternalChain,
  isRelayChain,
  type TChain,
  Version
} from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { CustomChainInvalidError } from '../../errors'
import { getChain } from '../getChain'

export const getChainVersion = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  chain: TChain | TCustomChain
): Version => {
  if (isRelayChain(chain) || isExternalChain(chain)) {
    return Version.V5
  }

  if (isCustomChain(chain)) {
    const entry = api._customCtx.customChains?.[chain]

    if (!entry) {
      throw new CustomChainInvalidError(`Custom chain '${chain}' is not registered.`)
    }

    return entry.xcmVersion
  }

  return getChain<TApi, TRes, TSigner, typeof chain>(chain).version
}
