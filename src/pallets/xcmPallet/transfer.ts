// Contains basic call formatting for different XCM Palletss

import type { ApiPromise } from '@polkadot/api'
import { Extrinsic, TNode, TSerializedApiCall, Version } from '../../types'
import {
  createHeaderPolkadotXCM,
  createCurrencySpecification,
  getNode,
  callPolkadotJsTxFunction,
  generateAddressPayload
} from '../../utils'
import { getParaId, getRelayChainSymbol, hasSupportForAsset } from '../assets'
import { getAssetBySymbolOrId } from '../assets/assetsUtils'
import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import { NodeNotSupportedError } from '../../errors/NodeNotSupportedError'
import { IncompatibleNodesError } from '../../errors'

const sendCommon = (
  api: ApiPromise,
  origin: TNode,
  currencySymbolOrId: string | number | bigint,
  amount: string,
  to: string,
  destination?: TNode,
  serializedApiCallEnabled = false
): Extrinsic | TSerializedApiCall => {
  if (typeof currencySymbolOrId === 'number' && currencySymbolOrId > Number.MAX_SAFE_INTEGER) {
    throw new InvalidCurrencyError(
      'The provided asset ID is larger than the maximum safe integer value. Please provide it as a string.'
    )
  }

  const asset = getAssetBySymbolOrId(origin, currencySymbolOrId.toString())

  if (destination) {
    const originRelayChainSymbol = getRelayChainSymbol(origin)
    const destinationRelayChainSymbol = getRelayChainSymbol(destination)
    if (originRelayChainSymbol !== destinationRelayChainSymbol) {
      throw new IncompatibleNodesError()
    }
  }

  if (!asset) {
    throw new InvalidCurrencyError(
      `Origin node ${origin} does not support currency or currencyId ${currencySymbolOrId}.`
    )
  }

  if (destination && asset.symbol && !hasSupportForAsset(destination, asset.symbol)) {
    throw new InvalidCurrencyError(
      `Destination node ${destination} does not support currency or currencyId ${currencySymbolOrId}.`
    )
  }
  const { symbol: currencySymbol, assetId: currencyId } = asset

  return getNode(origin).transfer(
    api,
    currencySymbol,
    currencyId,
    amount,
    to,
    destination,
    serializedApiCallEnabled
  )
}

export const sendSerializedApiCall = (
  api: ApiPromise,
  origin: TNode,
  currencySymbolOrId: string | number | bigint,
  amount: string | number | bigint,
  to: string,
  destination?: TNode
): TSerializedApiCall => {
  return sendCommon(
    api,
    origin,
    currencySymbolOrId,
    amount.toString(),
    to,
    destination,
    true
  ) as TSerializedApiCall
}

export function send(
  api: ApiPromise,
  origin: TNode,
  currencySymbolOrId: string | number | bigint,
  amount: string | number | bigint,
  to: string,
  destination?: TNode
): Extrinsic {
  return sendCommon(
    api,
    origin,
    currencySymbolOrId,
    amount.toString(),
    to,
    destination
  ) as Extrinsic
}

// TODO: Refactor this function
export const transferRelayToParaCommon = (
  api: ApiPromise,
  destination: TNode,
  amount: string,
  to: string,
  serializedApiCallEnabled = false
): Extrinsic | TSerializedApiCall | never => {
  const paraId = getParaId(destination)
  if (
    destination === 'AssetHubPolkadot' ||
    destination === 'AssetHubKusama' ||
    destination === 'Moonbeam' ||
    destination === 'Moonriver'
  ) {
    // Same for AssetHubPolkadot, AssetHubKusama, Encoiter and Moonbeam
    const serializedApiCall = {
      module: 'xcmPallet',
      section:
        destination === 'Moonbeam' || destination === 'Moonriver'
          ? 'limitedReserveTransferAssets'
          : 'limitedTeleportAssets',
      parameters: [
        createHeaderPolkadotXCM('RelayToPara', Version.V3, paraId),
        generateAddressPayload(api, 'RelayToPara', null, to, Version.V3, paraId),
        createCurrencySpecification(amount, 'RelayToPara', Version.V3, destination),
        0,
        'Unlimited'
      ]
    }
    if (serializedApiCallEnabled) {
      return serializedApiCall
    }
    return callPolkadotJsTxFunction(api, serializedApiCall)
  } else if (destination === 'Encointer') {
    const serializedApiCall = {
      module: 'xcmPallet',
      section: 'limitedTeleportAssets',
      parameters: [
        createHeaderPolkadotXCM('RelayToPara', Version.V1, paraId),
        generateAddressPayload(api, 'RelayToPara', null, to, Version.V1, paraId),
        createCurrencySpecification(amount, 'RelayToPara', Version.V1, destination),
        0,
        'Unlimited'
      ]
    }
    if (serializedApiCallEnabled) {
      return serializedApiCall
    }
    return callPolkadotJsTxFunction(api, serializedApiCall)
  } else if (
    destination === 'Darwinia' ||
    destination === 'Crab' ||
    destination === 'Integritee' ||
    destination === 'Nodle' ||
    destination === 'Pendulum'
  ) {
    // Do not do anything because Darwinia and Crab does not have DOT and KSM registered
    throw new NodeNotSupportedError(
      'These nodes do not support XCM transfers from Relay / to Relay chain.'
    )
  }

  const serializedApiCall = {
    module: 'xcmPallet',
    section: 'reserveTransferAssets',
    parameters: [
      createHeaderPolkadotXCM('RelayToPara', Version.V3, paraId),
      generateAddressPayload(api, 'RelayToPara', null, to, Version.V3, paraId),
      createCurrencySpecification(amount, 'RelayToPara', Version.V3, destination),
      0
    ]
  }
  if (serializedApiCallEnabled) {
    return serializedApiCall
  }

  return callPolkadotJsTxFunction(api, serializedApiCall)
}

export function transferRelayToPara(
  api: ApiPromise,
  destination: TNode,
  amount: string | number | bigint,
  to: string
): Extrinsic | never {
  return transferRelayToParaCommon(api, destination, amount.toString(), to) as Extrinsic | never
}

export const transferRelayToParaSerializedApiCall = (
  api: ApiPromise,
  destination: TNode,
  amount: string | number | bigint,
  to: string
): TSerializedApiCall =>
  transferRelayToParaCommon(api, destination, amount.toString(), to, true) as TSerializedApiCall
