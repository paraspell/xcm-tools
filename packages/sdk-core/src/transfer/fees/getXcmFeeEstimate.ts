import { findAssetForNodeOrThrow, getNativeAssetSymbol } from '@paraspell/assets'

import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import type { TGetXcmFeeEstimateOptions, TGetXcmFeeEstimateResult } from '../../types/TXcmFee'
import { resolveFeeAsset } from '../utils'
import { getOriginXcmFeeEstimate } from './getOriginXcmFeeEstimate'
import { getReverseTxFee } from './getReverseTxFee'
import { isSufficientDestination, isSufficientOrigin } from './isSufficient'

const BRIDGE_FEE_DOT = 682_395_810n // 0.068239581 DOT
const BRIDGE_FEE_KSM = 12_016_807_000n // 0.012016807 KSM

export const getXcmFeeEstimate = async <TApi, TRes>(
  options: TGetXcmFeeEstimateOptions<TApi, TRes>
): Promise<TGetXcmFeeEstimateResult> => {
  const { api, origin, destination, currency, feeAsset, address, senderAddress } = options

  const originAsset = findAssetForNodeOrThrow(origin, currency, destination)

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, origin, destination, currency)
    : undefined

  await api.init(origin, DRY_RUN_CLIENT_TIMEOUT_MS)

  const destApi = api.clone()
  await destApi.init(destination, DRY_RUN_CLIENT_TIMEOUT_MS)

  if (
    (origin === 'AssetHubPolkadot' && destination === 'AssetHubKusama') ||
    (origin === 'AssetHubKusama' && destination === 'AssetHubPolkadot')
  ) {
    const [fixedOriginFee, fixedDestinationFee] =
      origin === 'AssetHubPolkadot'
        ? [BRIDGE_FEE_DOT, BRIDGE_FEE_KSM]
        : [BRIDGE_FEE_KSM, BRIDGE_FEE_DOT]

    const originSufficient = await isSufficientOrigin(
      api,
      origin,
      senderAddress,
      fixedOriginFee,
      resolvedFeeAsset
    )

    const destinationSufficient = await isSufficientDestination(
      destApi,
      destination,
      address,
      BigInt(currency.amount),
      originAsset
    )

    return {
      origin: {
        fee: fixedOriginFee,
        currency: getNativeAssetSymbol(origin),
        sufficient: originSufficient
      },
      destination: {
        fee: fixedDestinationFee,
        currency: getNativeAssetSymbol(destination),
        sufficient: destinationSufficient
      }
    }
  }

  const originFeeDetails = await getOriginXcmFeeEstimate(options)

  const currencyInput = originAsset.multiLocation
    ? { multilocation: originAsset.multiLocation }
    : { symbol: originAsset.symbol }

  const destinationFee =
    destination === 'Ethereum'
      ? 0n
      : await getReverseTxFee({ ...options, api: destApi, destination }, currencyInput)

  const destinationSufficient = await isSufficientDestination(
    destApi,
    destination,
    address,
    BigInt(currency.amount),
    originAsset
  )

  const destFeeDetails = {
    fee: destinationFee,
    currency: getNativeAssetSymbol(destination),
    sufficient: destinationSufficient
  }

  return {
    origin: originFeeDetails,
    destination: destFeeDetails
  }
}
