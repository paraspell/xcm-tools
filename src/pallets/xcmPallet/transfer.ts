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

  return getNode(origin).transfer(api, currencySymbol, currencyId, amount, to, destination)
}

export function transferRelayToPara(
  api: ApiPromise,
  destination: TNode,
  amount: any,
  to: string
): Extrinsic | never {
  const paraId = getParaId(destination)
  if (destination === 'Statemine' || destination === 'Encointer') {
    // Same for Statemint, Statemine and Encoiter
    return api.tx.xcmPallet.limitedTeleportAssets(
      createHeaderPolkadotXCM('RelayToPara', paraId),
      handleAddress('RelayToPara', '', api, to, paraId),
      createCurrencySpecification(amount, 'RelayToPara'),
      0,
      'Unlimited'
    )
  } else if (destination === 'Darwinia' || destination === 'Crab' || destination === 'Quartz') {
    // Do not do anything because Darwinia and Crab does not have DOT and KSM registered Quartz does not work with UMP & DMP too
    throw new NodeNotSupportedError(
      'These nodes do not support XCM transfers from Relay / to Relay chain.'
    )
  }
  return api.tx.xcmPallet.reserveTransferAssets(
    createHeaderPolkadotXCM('RelayToPara', paraId),
    handleAddress('RelayToPara', '', api, to, paraId),
    createCurrencySpecification(amount, 'RelayToPara'),
    0
  )
}
