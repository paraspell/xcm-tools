import { isTLocation, TChain, type TSubstrateChain, type Version } from '@paraspell/sdk-common'

import type { OneKey, TDestination } from '../../types'
import { getChainVersion } from '../chain'

export const addXcmVersionHeader = <T, V extends Version>(obj: T, version: V) =>
  ({ [version]: obj }) as OneKey<V, T>

export const selectXcmVersion = (
  forcedVersion: Version | undefined,
  originVersion: Version,
  destMaxVersion?: Version
): Version => {
  if (forcedVersion) return forcedVersion

  const destVersion = destMaxVersion ?? originVersion

  return destVersion < originVersion ? destVersion : originVersion
}

export const pickCompatibleXcmVersion = (
  origin: TSubstrateChain,
  destination: TDestination,
  override?: Version
) => {
  const originVersion = getChainVersion(origin)
  const destVersion = !isTLocation(destination) ? getChainVersion(destination) : undefined
  return selectXcmVersion(override, originVersion, destVersion)
}

export const pickRouterCompatibleXcmVersion = (
  origin: TSubstrateChain | undefined,
  exchangeChain: TSubstrateChain,
  destination: TChain | undefined
): Version => {
  const exchangeVersion = getChainVersion(exchangeChain)
  const originVersion = origin ? getChainVersion(origin) : undefined
  const destVersion = destination ? getChainVersion(destination) : undefined

  // Find minimum compatible version across all defined chains
  const minWithOrigin = selectXcmVersion(undefined, exchangeVersion, originVersion)
  return selectXcmVersion(undefined, minWithOrigin, destVersion)
}
