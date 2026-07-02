import { isTLocation } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../api'
import type { TDestination } from '../types'

export const resolveParaId = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  paraId: number | undefined,
  destination: TDestination,
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>
) => {
  if (isTLocation(destination)) {
    return undefined
  }

  return paraId !== undefined ? paraId : api.getParaId(destination)
}
