import { isTMultiLocation } from '@paraspell/sdk-common'

import { getParaId } from '../nodes/config'
import type { TDestination } from '../types'

export const resolveParaId = (paraId: number | undefined, destination: TDestination) => {
  if (isTMultiLocation(destination)) {
    return undefined
  }

  return paraId ?? getParaId(destination)
}
