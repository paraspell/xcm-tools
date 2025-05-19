import {
  findAssetForNodeOrThrow,
  getNativeAssetSymbol,
  InvalidCurrencyError
} from '@paraspell/assets'

import { Builder } from '../../builder'
import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import type { TGetXcmFeeEstimateOptions, TGetXcmFeeEstimateResult } from '../../types/TXcmFee'
import { getOriginXcmFeeEstimate } from './getOriginXcmFeeEstimate'
import { padFee } from './padFee'

const BRIDGE_FEE_DOT = 682_395_810n // 0.068239581 DOT
const BRIDGE_FEE_KSM = 12_016_807_000n // 0.012016807 KSM

export const getXcmFeeEstimate = async <TApi, TRes>(
  options: TGetXcmFeeEstimateOptions<TApi, TRes>
): Promise<TGetXcmFeeEstimateResult> => {
  const { api, origin, destination, address, senderAddress, currency } = options

  if (origin === 'AssetHubPolkadot' && destination === 'AssetHubKusama') {
    return {
      origin: { fee: BRIDGE_FEE_DOT, currency: getNativeAssetSymbol(origin) },
      destination: { fee: BRIDGE_FEE_KSM, currency: getNativeAssetSymbol(destination) }
    }
  }

  if (origin === 'AssetHubKusama' && destination === 'AssetHubPolkadot') {
    return {
      origin: { fee: BRIDGE_FEE_KSM, currency: getNativeAssetSymbol(origin) },
      destination: { fee: BRIDGE_FEE_DOT, currency: getNativeAssetSymbol(destination) }
    }
  }

  const originFeeDetails = await getOriginXcmFeeEstimate(options)

  const destApi = api.clone()
  await destApi.init(destination, DRY_RUN_CLIENT_TIMEOUT_MS)

  if ('multiasset' in currency) {
    throw new InvalidCurrencyError(
      'Multi-assets are not yet supported for simple XCM fee estimation.'
    )
  }

  const originAsset = findAssetForNodeOrThrow(origin, currency, destination)

  const currencyInput = originAsset.multiLocation
    ? { multilocation: originAsset.multiLocation }
    : { symbol: originAsset.symbol }

  const flippedTx = await Builder(destApi)
    .from(destination)
    .to(origin)
    .address(senderAddress)
    .senderAddress(address)
    .currency({ ...currencyInput, amount: currency.amount })
    .build()

  const rawDestFee = await destApi.calculateTransactionFee(flippedTx, address)
  const destinationFee = padFee(rawDestFee, origin, destination, 'destination')

  const destFeeDetails = {
    fee: destinationFee,
    currency: getNativeAssetSymbol(destination)
  }

  return {
    origin: originFeeDetails,
    destination: destFeeDetails
  }
}
