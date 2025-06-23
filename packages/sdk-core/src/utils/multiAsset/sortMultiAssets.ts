import { extractMultiAssetLoc, type TMultiAsset } from '@paraspell/assets'
import { getJunctionValue, hasJunction, type TMultiLocation } from '@paraspell/sdk-common'

const isHere = (loc: TMultiLocation): boolean => {
  return loc.interior === 'Here' || loc.interior?.Here !== undefined
}

export const sortMultiAssets = (assets: TMultiAsset[]) =>
  assets.sort((a, b) => {
    const aLoc = extractMultiAssetLoc(a)
    const bLoc = extractMultiAssetLoc(b)

    // 1. Sort by parents first
    if (aLoc.parents !== bLoc.parents) {
      return Number(aLoc.parents) - Number(bLoc.parents)
    }

    // 2. If parents are equal, use priority function
    const aIsHere = isHere(aLoc)
    const bIsHere = isHere(bLoc)

    const aHasGlobal = hasJunction(aLoc, 'GlobalConsensus')
    const bHasGlobal = hasJunction(bLoc, 'GlobalConsensus')

    const aGeneralIndex = getJunctionValue<number>(aLoc, 'GeneralIndex')
    const bGeneralIndex = getJunctionValue<number>(bLoc, 'GeneralIndex')

    const getPriority = (isHere: boolean, hasGlobal: boolean): number => {
      if (isHere) return 0
      if (hasGlobal) return 2
      return 1
    }

    const aPriority = getPriority(aIsHere, aHasGlobal)
    const bPriority = getPriority(bIsHere, bHasGlobal)

    if (aPriority !== bPriority) return aPriority - bPriority

    if (aGeneralIndex === undefined && bGeneralIndex === undefined) return 0
    if (aGeneralIndex === undefined) return 1
    if (bGeneralIndex === undefined) return -1

    return aGeneralIndex - bGeneralIndex
  })
