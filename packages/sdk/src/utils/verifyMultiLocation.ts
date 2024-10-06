import { getAssetsObject } from '../pallets/assets'
import type { TMultiLocation, TNode } from '../types'
import { deepEqual } from './deepEqual'

export const verifyMultiLocation = (node: TNode, multiLocation: TMultiLocation) => {
  const { multiLocations } = getAssetsObject(node)
  if (!multiLocations) return true
  return multiLocations.some(location => deepEqual(location, multiLocation))
}
