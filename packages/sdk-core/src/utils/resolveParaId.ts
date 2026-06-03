import { isTLocation } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../api'
import { getParaIdImpl } from '../chains/config'
import type { TDestination } from '../types'

export const resolveParaId = <TApi, TRes, TSigner>(
  paraId: number | undefined,
  destination: TDestination,
  api: PolkadotApi<TApi, TRes, TSigner>
) => {
  if (isTLocation(destination)) {
    return undefined
  }

  return paraId !== undefined ? paraId : getParaIdImpl(destination, api._customCtx)
}
