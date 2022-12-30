import type { ApiPromise } from '@polkadot/api'
import { Extrinsic, TNode, TScenario } from '../../types'
import { handleAddress, getFees, constructXTokens, getAvailableXCMPallet, constructPolkadotXCM, createHeaderPolkadotXCM, createCurrencySpecification } from '../../utils'
import { getParaId, hasSupportForAsset } from '../assets'
import { InvalidCurrencyError } from './InvalidCurrencyError'
import { NodeNotSupportedError } from './nodeNotSupportedError'

export function send(
  api: ApiPromise,
  origin: TNode,
  currency: string,
  currencyID: number,
  amount: any,
  to: string,
  destination?: TNode
): Extrinsic {
  if (!hasSupportForAsset(origin, currency)) { throw new InvalidCurrencyError(`Node ${origin} does not support currency ${currency}.`) }

  const type: TScenario = destination ? 'ParaToPara' : 'ParaToRelay'
  const paraId = destination ? getParaId(destination) : undefined
  const pallet = getAvailableXCMPallet(origin)
  if (pallet === 'xTokens' || pallet === 'ormlXTokens') {
    return constructXTokens(
      api,
      origin,
      currencyID,
      currency,
      amount,
      handleAddress(type, 'xTokens', api, to, paraId),
      getFees(type)
    )
  } else if (pallet === 'polkadotXCM' || pallet === 'relayerXcm') {
    // Specific node requirements
    if ((origin === 'Statemint' || origin === 'Statemine') && type === 'ParaToPara') {
      return constructPolkadotXCM(
        api,
        origin,
        createHeaderPolkadotXCM(type, paraId),
        handleAddress(type, 'polkadotXCM', api, to, paraId),
        createCurrencySpecification(amount, type, origin, currencyID),
        type
      )
    } else if ((origin === 'Darwinia' || origin === 'Crab') && type === 'ParaToPara') {
      return constructPolkadotXCM(
        api,
        origin,
        createHeaderPolkadotXCM(type, paraId),
        handleAddress(type, 'polkadotXCM', api, to, paraId),
        createCurrencySpecification(amount, type, origin),
        type
      )
    } else if (origin === 'Quartz' && type === 'ParaToPara') {
      return constructPolkadotXCM(
        api,
        origin,
        createHeaderPolkadotXCM(type, paraId, origin),
        handleAddress(type, 'polkadotXCM', api, to, paraId, origin),
        createCurrencySpecification(amount, type, origin),
        type
      )
    }

    return constructPolkadotXCM(
      api,
      origin,
      createHeaderPolkadotXCM(type, paraId),
      handleAddress(type, 'polkadotXCM', api, to, paraId),
      createCurrencySpecification(amount, type),
      type
    )
  }
  throw new Error(`Invalid pallet: ${pallet}`)
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
    throw new NodeNotSupportedError('These nodes do not support XCM transfers from Relay / to Relay chain.')
  }
  return api.tx.xcmPallet.reserveTransferAssets(
    createHeaderPolkadotXCM('RelayToPara', paraId),
    handleAddress('RelayToPara', '', api, to, paraId),
    createCurrencySpecification(amount, 'RelayToPara'),
    0
  )
}
