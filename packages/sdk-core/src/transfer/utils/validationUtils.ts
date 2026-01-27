import {
  getRelayChainSymbol,
  InvalidCurrencyError,
  isChainEvm,
  isSymbolSpecifier,
  isTAsset,
  type TCurrencyInput
} from '@paraspell/assets'
import {
  isBridge,
  isExternalChain,
  isRelayChain,
  isTLocation,
  type TSubstrateChain
} from '@paraspell/sdk-common'
import { isHex } from 'viem'

import { ScenarioNotSupportedError, UnsupportedOperationError, ValidationError } from '../../errors'
import type { TDestination, TSendOptions } from '../../types'
import { compareAddresses, getChain } from '../../utils'

export const validateCurrency = (currency: TCurrencyInput, feeAsset?: TCurrencyInput) => {
  if (Array.isArray(currency)) {
    if (currency.length === 0) {
      throw new InvalidCurrencyError('Overridden assets cannot be empty')
    }

    if (currency.length === 1) {
      throw new InvalidCurrencyError('Please provide more than one asset')
    }

    if (currency.length > 1 && !currency.every(asset => isTAsset(asset)) && !feeAsset) {
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
    throw new ScenarioNotSupportedError(
      'Direct relay chain to relay chain transfers are not supported. Please use Polkadot <-> Kusama bridge through AssetHub.'
    )
  }

  const allowedChainsToEthereum = [
    'AssetHubPolkadot',
    'AssetHubPaseo',
    'AssetHubWestend',
    'Hydration',
    'BifrostPolkadot',
    'Moonbeam',
    'Mythos'
  ]

  if (
    typeof destination === 'string' &&
    isExternalChain(destination) &&
    !allowedChainsToEthereum.includes(origin)
  ) {
    throw new ScenarioNotSupportedError(
      `Transfers to Ethereum are only supported from: ${allowedChainsToEthereum.join(', ')}`
    )
  }

  const isLocationDestination = typeof destination === 'object'
  const isBridgeTransfer = !isTLocation(destination) && isBridge(origin, destination)
  const isRelayDestination = !isTLocation(destination) && isRelayChain(destination)

  if (!isRelayDestination && !isLocationDestination) {
    const originRelayChainSymbol = getRelayChainSymbol(origin)
    const destinationRelayChainSymbol = getRelayChainSymbol(destination)
    if (!isBridgeTransfer && originRelayChainSymbol !== destinationRelayChainSymbol) {
      throw new ScenarioNotSupportedError(
        'Origin and destination must share the same relay chain unless using a bridge.'
      )
    }
  }

  if (isRelayChain(origin) && typeof destination === 'string' && !isExternalChain(destination)) {
    const chain = getChain(destination)
    if (!chain.isRelayToParaEnabled()) {
      throw new ScenarioNotSupportedError({ chain: destination, scenario: 'RelayToPara' })
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

export const validateTransact = <TApi, TRes>({
  api,
  from,
  to,
  senderAddress,
  address,
  transactOptions
}: TSendOptions<TApi, TRes>) => {
  const call = transactOptions?.call

  if (!call) return

  if (from === to) {
    throw new UnsupportedOperationError('Cannot use transact options with local transfers.')
  }

  if (typeof call === 'string' && !isHex(call)) {
    throw new ValidationError('Transact call hex must be a valid hex string.')
  }

  if (isChainEvm(from) || (typeof to === 'string' && isChainEvm(to))) {
    throw new UnsupportedOperationError(
      'Transact option is only supported for Substrate to Substrate scenarios.'
    )
  }

  if (
    typeof address === 'string' &&
    senderAddress &&
    !compareAddresses(api, address, senderAddress)
  ) {
    return new ValidationError(
      'Sender address must match the destination address for transact to work.'
    )
  }
}
