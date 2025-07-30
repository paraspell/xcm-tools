import {
  getRelayChainSymbol,
  InvalidCurrencyError,
  isSymbolSpecifier,
  isTAsset,
  type TCurrencyInput
} from '@paraspell/assets'
import {
  isDotKsmBridge,
  isRelayChain,
  isTLocation,
  type TSubstrateChain
} from '@paraspell/sdk-common'

import { IncompatibleChainsError } from '../../errors'
import type { TDestination } from '../../types'

export const validateCurrency = (currency: TCurrencyInput, feeAsset?: TCurrencyInput) => {
  if ('multiasset' in currency) {
    if (currency.multiasset.length === 0) {
      throw new InvalidCurrencyError('Overridden assets cannot be empty')
    }

    if (currency.multiasset.length === 1) {
      throw new InvalidCurrencyError('Please provide more than one asset')
    }

    if (
      currency.multiasset.length > 1 &&
      !currency.multiasset.every(asset => isTAsset(asset)) &&
      !feeAsset
    ) {
      throw new InvalidCurrencyError(
        'Overridden assets cannot be used without specifying fee asset'
      )
    }
  }
}

export const validateDestination = (origin: TSubstrateChain, destination: TDestination) => {
  if (
    isRelayChain(origin) &&
    !isTLocation(destination) &&
    isRelayChain(destination) &&
    origin !== destination
  ) {
    throw new IncompatibleChainsError(
      'Direct relay chain to relay chain transfers are not supported. Please use Polkadot <-> Kusama bridge through AssetHub.'
    )
  }

  const allowedChainsToEthereum = [
    'AssetHubPolkadot',
    'Hydration',
    'BifrostPolkadot',
    'Moonbeam',
    'Mythos'
  ]

  if (destination === 'Ethereum' && !allowedChainsToEthereum.includes(origin)) {
    throw new IncompatibleChainsError(
      `Transfers to Ethereum are only supported from: ${allowedChainsToEthereum.join(', ')}`
    )
  }

  const isLocationDestination = typeof destination === 'object'
  const isBridge = !isTLocation(destination) && isDotKsmBridge(origin, destination)
  const isRelayDestination = !isTLocation(destination) && isRelayChain(destination)

  if (!isRelayDestination && !isLocationDestination) {
    const originRelayChainSymbol = getRelayChainSymbol(origin)
    const destinationRelayChainSymbol = getRelayChainSymbol(destination)
    if (!isBridge && originRelayChainSymbol !== destinationRelayChainSymbol) {
      throw new IncompatibleChainsError()
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
