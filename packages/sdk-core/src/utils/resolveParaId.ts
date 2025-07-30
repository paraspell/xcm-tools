import { isTLocation } from '@paraspell/sdk-common'

import { getParaId } from '../chains/config'
import type { TDestination } from '../types'

export const resolveParaId = (paraId: number | undefined, destination: TDestination) => {
  if (isTLocation(destination)) {
    return undefined
  }

  return paraId ?? getParaId(destination)
}
