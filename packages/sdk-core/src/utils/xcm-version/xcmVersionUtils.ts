import type { TChain } from '@paraspell/sdk-common'
import { isTLocation, type TSubstrateChain, type Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
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

export const pickCompatibleXcmVersion = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  origin: TSubstrateChain | TCustomChain,
  destination: TDestination,
  override?: Version
) => {
  const originVersion = getChainVersion(api, origin)
  const destVersion = !isTLocation(destination) ? getChainVersion(api, destination) : undefined
  return selectXcmVersion(override, originVersion, destVersion)
}

export const pickRouterCompatibleXcmVersion = <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  origin: TSubstrateChain | undefined,
  exchangeChain: TSubstrateChain,
  destination: TChain | undefined
): Version => {
  const exchangeVersion = getChainVersion(api, exchangeChain)
  const originVersion = origin ? getChainVersion(api, origin) : undefined
  const destVersion = destination ? getChainVersion(api, destination) : undefined

  // Find minimum compatible version across all defined chains
  const minWithOrigin = selectXcmVersion(undefined, exchangeVersion, originVersion)
  return selectXcmVersion(undefined, minWithOrigin, destVersion)
}
