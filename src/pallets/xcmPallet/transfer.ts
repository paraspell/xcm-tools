//Contains basic call formatting for different XCM Palletss

import type { ApiPromise } from '@polkadot/api'
import { Extrinsic, TNode } from '../../types'
import {
  handleAddress,
  createHeaderPolkadotXCM,
  createCurrencySpecification,
  getNode
} from '../../utils'
import { getParaId, hasSupportForAsset } from '../assets'
import { getAssetBySymbolOrId } from '../assets/assetsUtils'
import { InvalidCurrencyError } from '../../errors/InvalidCurrencyError'
import { NodeNotSupportedError } from '../../errors/NodeNotSupportedError'

export function send(
  api: ApiPromise,
  origin: TNode,
  currencySymbolOrId: string | number | bigint,
  amount: any,
  to: string,
  version: number,
  destination?: TNode
): Extrinsic {
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

  return getNode(origin).transfer(api, currencySymbol, currencyId, amount, to, version, destination)
}

export function transferRelayToPara(
  api: ApiPromise,
  destination: TNode,
  amount: any,
  to: string
): Extrinsic | never {
  const paraId = getParaId(destination)
  if (destination === 'Statemint' || destination === 'Statemine') {
    // Same for Statemint, Statemine and Encoiter
    return api.tx.xcmPallet.limitedTeleportAssets(
      createHeaderPolkadotXCM('RelayToPara', 3, paraId,destination),
      handleAddress('RelayToPara', '', api, to, 3, paraId,destination),
      createCurrencySpecification(amount, 'RelayToPara', 3, destination),
      0,
      'Unlimited'
    )
  } else if (destination === 'Encointer') {
    return api.tx.xcmPallet.limitedTeleportAssets(
      createHeaderPolkadotXCM('RelayToPara', 1, paraId,destination),
      handleAddress('RelayToPara', '', api, to, 1, paraId,destination),
      createCurrencySpecification(amount, 'RelayToPara', 1, destination),
      0,
      'Unlimited'
    )
  } 
  
    else if (destination === 'Darwinia' || destination === 'Crab') {
    // Do not do anything because Darwinia and Crab does not have DOT and KSM registered 
    throw new NodeNotSupportedError(
      'These nodes do not support XCM transfers from Relay / to Relay chain.'
    )
  }
  return api.tx.xcmPallet.reserveTransferAssets(
    createHeaderPolkadotXCM('RelayToPara', 3, paraId,destination),
    handleAddress('RelayToPara', '', api, to, 3, paraId,destination),
    createCurrencySpecification(amount, 'RelayToPara', 3, destination),
    0
  )
}
