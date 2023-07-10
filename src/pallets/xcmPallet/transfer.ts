// Contains basic call formatting for different XCM Palletss

import type { ApiPromise } from '@polkadot/api'
import { Extrinsic, TNode, TSerializedApiCall, Version } from '../../types'
import {
  handleAddress,
  createHeaderPolkadotXCM,
  createCurrencySpecification,
  getNode,
  callPolkadotJsTxFunction
} from '../../utils'
import { getParaId, hasSupportForAsset } from '../assets'
import { getAssetBySymbolOrId } from '../assets/assetsUtils'
import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import { NodeNotSupportedError } from '../../errors/NodeNotSupportedError'

const sendCommon = (
  api: ApiPromise,
  origin: TNode,
  currencySymbolOrId: string | number | bigint,
  amount: any,
  to: string,
  destination?: TNode,
  serializedApiCallEnabled = false
): Extrinsic | TSerializedApiCall => {
  const asset = getAssetBySymbolOrId(origin, currencySymbolOrId.toString())

  if (!asset) {
    throw new InvalidCurrencyError(
      `Origin node ${origin} does not support currency or currencyId ${currencySymbolOrId}.`
    )
  }

  if (destination && !hasSupportForAsset(destination, asset.symbol)) {
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
  amount: any,
  to: string,
  destination?: TNode
): TSerializedApiCall => {
  return sendCommon(
    api,
    origin,
    currencySymbolOrId,
    amount,
    to,
    destination,
    true
  ) as TSerializedApiCall
}

export function send(
  api: ApiPromise,
  origin: TNode,
  currencySymbolOrId: string | number | bigint,
  amount: any,
  to: string,
  destination?: TNode
): Extrinsic {
  return sendCommon(api, origin, currencySymbolOrId, amount, to, destination) as Extrinsic
}

// TODO: Refactor this function
export const transferRelayToParaCommon = (
  api: ApiPromise,
  destination: TNode,
  amount: any,
  to: string,
  serializedApiCallEnabled = false
): Extrinsic | TSerializedApiCall | never => {
  const paraId = getParaId(destination)
  if (destination === 'Statemint' || destination === 'Statemine') {
    // Same for Statemint, Statemine and Encoiter
    const serializedApiCall = {
      module: 'xcmPallet',
      section: 'limitedTeleportAssets',
      parameters: [
        createHeaderPolkadotXCM('RelayToPara', Version.V3, paraId),
        handleAddress('RelayToPara', '', api, to, Version.V3, paraId),
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
        handleAddress('RelayToPara', '', api, to, Version.V1, paraId),
        createCurrencySpecification(amount, 'RelayToPara', Version.V1, destination),
        0,
        'Unlimited'
      ]
    }
    if (serializedApiCallEnabled) {
      return serializedApiCall
    }
    return callPolkadotJsTxFunction(api, serializedApiCall)
  } else if (destination === 'Darwinia' || destination === 'Crab') {
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
      handleAddress('RelayToPara', '', api, to, Version.V3, paraId),
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
  amount: any,
  to: string
): Extrinsic | never {
  return transferRelayToParaCommon(api, destination, amount, to) as Extrinsic | never
}

export const transferRelayToParaSerializedApiCall = (
  api: ApiPromise,
  destination: TNode,
  amount: any,
  to: string
): TSerializedApiCall =>
  transferRelayToParaCommon(api, destination, amount, to, true) as TSerializedApiCall
