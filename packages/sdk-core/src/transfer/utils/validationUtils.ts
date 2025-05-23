import {
  getRelayChainSymbol,
  InvalidCurrencyError,
  isSymbolSpecifier,
  isTMultiAsset,
  type TCurrencyInput
} from '@paraspell/assets'
import {
  isDotKsmBridge,
  isRelayChain,
  isTMultiLocation,
  type TNodeDotKsmWithRelayChains
} from '@paraspell/sdk-common'

import { IncompatibleNodesError } from '../../errors'
import type { TDestination } from '../../types'

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

  const allowedChainsToEthereum = ['AssetHubPolkadot', 'Hydration', 'BifrostPolkadot', 'Moonbeam']

  if (destination === 'Ethereum' && !allowedChainsToEthereum.includes(origin)) {
    throw new IncompatibleNodesError(
      `Transfers to Ethereum are only supported from: ${allowedChainsToEthereum.join(', ')}`
    )
  }

  const isMultiLocationDestination = typeof destination === 'object'
  const isBridge = !isTMultiLocation(destination) && isDotKsmBridge(origin, destination)
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
