import { findAssetForNodeOrThrow, getNativeAssetSymbol } from '@paraspell/assets'

import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import type { TGetXcmFeeEstimateOptions, TGetXcmFeeEstimateResult } from '../../types/TXcmFee'
import { getOriginXcmFeeEstimate } from './getOriginXcmFeeEstimate'
import { getReverseTxFee } from './getReverseTxFee'

const BRIDGE_FEE_DOT = 682_395_810n // 0.068239581 DOT
const BRIDGE_FEE_KSM = 12_016_807_000n // 0.012016807 KSM

export const getXcmFeeEstimate = async <TApi, TRes>(
  options: TGetXcmFeeEstimateOptions<TApi, TRes>
): Promise<TGetXcmFeeEstimateResult> => {
  const { api, origin, destination, currency } = options

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

  if (destination !== 'Ethereum') await destApi.init(destination, DRY_RUN_CLIENT_TIMEOUT_MS)

  const originAsset = findAssetForNodeOrThrow(origin, currency, destination)

  const currencyInput = originAsset.multiLocation
    ? { multilocation: originAsset.multiLocation }
    : { symbol: originAsset.symbol }

  const destinationFee =
    destination === 'Ethereum'
      ? 0n
      : await getReverseTxFee({ ...options, api: destApi, destination }, currencyInput)

  const destFeeDetails = {
    fee: destinationFee,
    currency: getNativeAssetSymbol(destination)
  }

  return {
    origin: originFeeDetails,
    destination: destFeeDetails
  }
}
