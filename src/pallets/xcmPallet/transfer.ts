import type { ApiPromise } from '@polkadot/api'
import { Extrinsic, TNode, TScenario } from '../../types'
import { handleAddress, getFees, constructXTokens, getAvailableXCMPallet, constructPolkadotXCM, createHeaderPolkadotXCM, createCurrencySpecification } from '../../utils'
import { hasSupportForAsset } from '../assets'
import { InvalidCurrencyError } from './InvalidCurrencyError'
import { NodeNotSupportedError } from './nodeNotSupportedError'

export function send(
  api: ApiPromise,
  origin: TNode,
  currency: string,
  currencyID: number,
  amount: any,
  to: string,
  destination?: number
): Extrinsic {
  if (!hasSupportForAsset(origin, currency)) { throw new InvalidCurrencyError(`Node ${origin} does not support currency ${currency}.`) }

  const type: TScenario = destination ? 'ParaToPara' : 'ParaToRelay'
  const pallet = getAvailableXCMPallet(origin)
  if (pallet === 'xTokens' || pallet === 'ormlXTokens') {
    return constructXTokens(
      api,
      origin,
      currencyID,
      currency,
      amount,
      handleAddress(type, 'xTokens', api, to, destination),
      getFees(type)
    )
  } else if (pallet === 'polkadotXCM' || pallet === 'relayerXcm') {
    // Specific node requirements
    if ((origin === 'Statemint' || origin === 'Statemine') && type === 'ParaToPara') {
      return constructPolkadotXCM(
        api,
        origin,
        createHeaderPolkadotXCM(type, destination),
        handleAddress(type, 'polkadotXCM', api, to, destination),
        createCurrencySpecification(amount, type, origin, currencyID),
        type
      )
    } else if ((origin === 'Darwinia' || origin === 'Crab') && type === 'ParaToPara') {
      return constructPolkadotXCM(
        api,
        origin,
        createHeaderPolkadotXCM(type, destination),
        handleAddress(type, 'polkadotXCM', api, to, destination),
        createCurrencySpecification(amount, type, origin),
        type
      )
    } else if (origin === 'Quartz' && type === 'ParaToPara') {
      return constructPolkadotXCM(
        api,
        origin,
        createHeaderPolkadotXCM(type, destination, origin),
        handleAddress(type, 'polkadotXCM', api, to, destination, origin),
        createCurrencySpecification(amount, type, origin),
        type
      )
    }

    return constructPolkadotXCM(
      api,
      origin,
      createHeaderPolkadotXCM(type, destination),
      handleAddress(type, 'polkadotXCM', api, to, destination),
      createCurrencySpecification(amount, type),
      type
    )
  }
  throw new Error(`Invalid pallet: ${pallet}`)
}

export function transferRelayToPara(
  api: ApiPromise,
  destination: number,
  amount: any,
  to: string
): Extrinsic | never {
  if (destination === 1000 || destination === 1001) {
    // Same for Statemint, Statemine and Encoiter
    return api.tx.xcmPallet.limitedTeleportAssets(
      createHeaderPolkadotXCM('RelayToPara', destination),
      handleAddress('RelayToPara', '', api, to, destination),
      createCurrencySpecification(amount, 'RelayToPara'),
      0,
      'Unlimited'
    )
  } else if (destination === 2046 || destination === 2105 || destination === 2095) {
    // Do not do anything because Darwinia and Crab does not have DOT and KSM registered Quartz does not work with UMP & DMP too
    throw new NodeNotSupportedError('These nodes do not support XCM transfers from Relay / to Relay chain.')
  }
  return api.tx.xcmPallet.reserveTransferAssets(
    createHeaderPolkadotXCM('RelayToPara', destination),
    handleAddress('RelayToPara', '', api, to, destination),
    createCurrencySpecification(amount, 'RelayToPara'),
    0
  )
}
