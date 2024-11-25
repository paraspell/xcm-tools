import type { TCurrencyInput, TDestination, TNodePolkadotKusama } from '../../../types'
import { getAssetBySymbolOrId } from '../../assets/getAssetBySymbolOrId'
import { determineRelayChain } from '../../../utils'
import { isTMultiLocation } from '../utils'

export const resolveAsset = (
  currency: TCurrencyInput,
  origin: TNodePolkadotKusama,
  destination: TDestination | undefined,
  assetCheckEnabled: boolean
) => {
  const isRelayDestination = destination === undefined
  return assetCheckEnabled
    ? getAssetBySymbolOrId(
        origin,
        currency,
        isRelayDestination
          ? determineRelayChain(origin)
          : !isTMultiLocation(destination)
            ? destination
            : null
      )
    : null
}
