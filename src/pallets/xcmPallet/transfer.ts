import type { ApiPromise } from '@polkadot/api'
import { Extrinsic, TNode } from '../../types'
import { handleAddress, selectLimit, getFees, constructXTokens, getAvailableXCMPallet, constructPolkadotXCM, createHeaderPolkadotXCM, createCurrencySpecification } from '../../utils'
import { hasSupportForAsset } from '../assets'
import { InvalidCurrencyError } from './InvalidCurrencyError'

export function transferParaToRelay(
  api: ApiPromise,
  origin: TNode,
  currency: string,
  currencyID: number,
  amount: any,
  to: string
): Extrinsic | never {
  if (!hasSupportForAsset(origin, currency)) { throw new InvalidCurrencyError(`Node ${origin} does not support currency ${currency}.`) }

  const pallet = getAvailableXCMPallet(origin)
  if (pallet === 'xTokens' || pallet === 'ormlXTokens') {
    return constructXTokens(
      api,
      origin,
      currencyID,
      currency,
      amount,
      handleAddress('ParaToRelay', 'xTokens', api, to, 0),
      getFees('ParaToRelay')
    )
  } else if (pallet === 'polkadotXCM' || pallet === 'relayerXcm') {
    return constructPolkadotXCM(
      api,
      origin,
      createHeaderPolkadotXCM('ParaToRelay', 0),
      handleAddress('ParaToRelay', 'polkadotXCM', api, to, 0),
      createCurrencySpecification(amount, 'ParaToRelay'),
      'ParaToRelay'
    )
  }
}

export function transferParaToPara(
  api: ApiPromise,
  origin: TNode,
  destination: number,
  currency: string,
  currencyID: number,
  amount: any,
  to: string
): Extrinsic | never {
  if (!hasSupportForAsset(origin, currency)) { throw new InvalidCurrencyError(`Node ${origin} does not support currency ${currency}.`) }

  const pallet = getAvailableXCMPallet(origin)
  if (pallet === 'xTokens' || pallet === 'ormlXTokens') {
    return constructXTokens(
      api,
      origin,
      currencyID,
      currency,
      amount,
      handleAddress('ParaToPara', 'xTokens', api, to, destination),
      getFees('ParaToPara')
    )
  } else if (pallet === 'polkadotXCM' || pallet === 'relayerXcm') {
    return constructPolkadotXCM(
      api,
      origin,
      createHeaderPolkadotXCM('ParaToPara', destination),
      handleAddress('ParaToPara', 'polkadotXCM', api, to, destination),
      createCurrencySpecification(amount, 'ParaToPara'),
      'ParaToPara'
    )
  }
}

export function transferRelayToPara(
  api: ApiPromise,
  destination: number,
  amount: any,
  to: string
): Extrinsic {
  return api.tx.xcmPallet.reserveTransferAssets(
    createHeaderPolkadotXCM('RelayToPara', destination),
    handleAddress('RelayToPara', '', api, to, destination),
    createCurrencySpecification(amount, 'RelayToPara'),
    0
  )
}

export function limitedTransferRelayToPara(
  api: ApiPromise,
  destination: number,
  amount: any,
  to: string,
  limit: number,
  isLimited: boolean
): Extrinsic {
  return api.tx.xcmPallet.limitedReserveTransferAssets(
    createHeaderPolkadotXCM('RelayToPara', destination),
    handleAddress('RelayToPara', '', api, to, destination),
    createCurrencySpecification(amount, 'RelayToPara'),
    0,
    selectLimit(limit, isLimited)
  )
}
