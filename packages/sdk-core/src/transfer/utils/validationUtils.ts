import type { TAsset } from '@paraspell/assets'
import {
  getNativeAssets,
  getRelayChainSymbol,
  hasSupportForAsset,
  InvalidCurrencyError,
  isSymbolSpecifier,
  isTMultiAsset,
  type TCurrencyInput
} from '@paraspell/assets'
import { getDefaultPallet } from '@paraspell/pallets'
import {
  isRelayChain,
  isTMultiLocation,
  type TNodeDotKsmWithRelayChains
} from '@paraspell/sdk-common'

import { IncompatibleNodesError } from '../../errors'
import { throwUnsupportedCurrency } from '../../pallets/xcmPallet/utils'
import type { TDestination, TSendOptions } from '../../types'
import { isBridgeTransfer } from './isBridgeTransfer'

export const validateCurrency = (currency: TCurrencyInput, feeAsset?: TCurrencyInput) => {
  if ('multiasset' in currency) {
    if (currency.multiasset.length === 0) {
      throw new InvalidCurrencyError('Overridden multi assets cannot be empty')
    }

    if (currency.multiasset.length === 1) {
      throw new InvalidCurrencyError('Please provide more than one multi asset')
    }

    if (
      currency.multiasset.length > 1 &&
      !currency.multiasset.every(asset => isTMultiAsset(asset)) &&
      !feeAsset
    ) {
      throw new InvalidCurrencyError(
        'Overridden multi assets cannot be used without specifying fee asset'
      )
    }
  }
}

export const validateDestination = (
  origin: TNodeDotKsmWithRelayChains,
  destination: TDestination
) => {
  if (
    isRelayChain(origin) &&
    !isTMultiLocation(destination) &&
    isRelayChain(destination) &&
    origin !== destination
  ) {
    throw new IncompatibleNodesError(
      'Direct relay chain to relay chain transfers are not supported. Please use Polkadot <-> Kusama bridge through AssetHub.'
    )
  }

  if (
    destination === 'Ethereum' &&
    origin !== 'AssetHubPolkadot' &&
    origin !== 'Hydration' &&
    origin !== 'BifrostPolkadot' &&
    origin !== 'Moonbeam'
  ) {
    throw new IncompatibleNodesError(
      'Transfers to Ethereum are only supported from AssetHubPolkadot and Hydration.'
    )
  }

  const isMultiLocationDestination = typeof destination === 'object'
  const isBridge = isBridgeTransfer(origin, destination)
  const isRelayDestination = !isTMultiLocation(destination) && isRelayChain(destination)

  if (!isRelayDestination && !isMultiLocationDestination) {
    const originRelayChainSymbol = getRelayChainSymbol(origin)
    const destinationRelayChainSymbol = getRelayChainSymbol(destination)
    if (!isBridge && originRelayChainSymbol !== destinationRelayChainSymbol) {
      throw new IncompatibleNodesError()
    }
  }
}

export const validateAssetSpecifiers = (assetCheckEnabled: boolean, currency: TCurrencyInput) => {
  if (!assetCheckEnabled && 'symbol' in currency && isSymbolSpecifier(currency.symbol)) {
    throw new InvalidCurrencyError(
      'Symbol specifier is not supported when asset check is disabled. Please use normal symbol instead.'
    )
  }

  if (!assetCheckEnabled && 'id' in currency) {
    throw new InvalidCurrencyError(
      'Asset ID is not supported when asset check is disabled. Please use normal symbol instead'
    )
  }
}

export const validateAssetSupport = <TApi, TRes>(
  { from: origin, to: destination, currency }: TSendOptions<TApi, TRes>,
  assetCheckEnabled: boolean,
  isBridge: boolean,
  asset: TAsset | null
) => {
  const isRelayDestination = !isTMultiLocation(destination) && isRelayChain(destination)
  const isMultiLocationDestination = typeof destination === 'object'
  const isDestAssetHub = destination === 'AssetHubPolkadot' || destination === 'AssetHubKusama'
  const pallet = getDefaultPallet(origin)
  const isBifrost = origin === 'BifrostPolkadot' || origin === 'BifrostKusama'

  if (!isBridge && isDestAssetHub && pallet === 'XTokens' && !isBifrost) {
    let nativeAssets = getNativeAssets(destination)

    if (origin === 'Hydration') {
      nativeAssets = nativeAssets.filter(nativeAsset => nativeAsset.symbol !== 'DOT')
    }

    if (
      'symbol' in currency &&
      nativeAssets.some(
        nativeAsset => nativeAsset.symbol.toLowerCase() === asset?.symbol?.toLowerCase()
      )
    ) {
      throw new InvalidCurrencyError(
        `${JSON.stringify(asset?.symbol)} is not supported for transfers to ${destination}.`
      )
    }
  }

  if (
    !isBridge &&
    !isRelayDestination &&
    !isMultiLocationDestination &&
    asset?.symbol !== undefined &&
    assetCheckEnabled &&
    !('id' in currency) &&
    !hasSupportForAsset(destination, asset.symbol)
  ) {
    throw new InvalidCurrencyError(
      `Destination node ${destination} does not support currency ${JSON.stringify(currency)}.`
    )
  }

  if (!isBridge && asset === null && assetCheckEnabled) {
    throwUnsupportedCurrency(currency, origin)
  }
}
