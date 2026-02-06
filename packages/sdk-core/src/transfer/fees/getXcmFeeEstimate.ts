import { findAssetInfoOrThrow, findAssetOnDestOrThrow } from '@paraspell/assets'
import { isExternalChain } from '@paraspell/sdk-common'

import { DRY_RUN_CLIENT_TIMEOUT_MS } from '../../constants'
import type { TGetXcmFeeEstimateOptions, TGetXcmFeeEstimateResult } from '../../types/TXcmFee'
import { abstractDecimals } from '../../utils'
import { resolveFeeAsset } from '../utils'
import { getOriginXcmFeeEstimate } from './getOriginXcmFeeEstimate'
import { getReverseTxFee } from './getReverseTxFee'
import { isSufficientDestination, isSufficientOrigin } from './isSufficient'

const BRIDGE_FEE_DOT = 682_395_810n // 0.068239581 DOT
const BRIDGE_FEE_KSM = 12_016_807_000n // 0.012016807 KSM

/**
 * @deprecated This function is deprecated and will be removed in a future version.
 * Please use `builder.getXcmFee()` instead, where `builder` is an instance of `Builder()`.
 * Will be removed in v13.
 * For more details, see the documentation:
 * {@link https://paraspell.github.io/docs/sdk/xcmPallet.html#xcm-fee-origin-and-dest}
 */
export const getXcmFeeEstimate = async <TApi, TRes, TSigner>(
  options: TGetXcmFeeEstimateOptions<TApi, TRes, TSigner>
): Promise<TGetXcmFeeEstimateResult> => {
  const { api, origin, destination, currency, feeAsset, address, senderAddress } = options

  const originAsset = findAssetInfoOrThrow(origin, currency, destination)
  const destAsset = findAssetOnDestOrThrow(origin, destination, currency)

  const amount = abstractDecimals(currency.amount, originAsset.decimals, api)

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
      destination,
      senderAddress,
      fixedOriginFee,
      {
        ...currency,
        amount
      },
      originAsset,
      resolvedFeeAsset
    )

    const destinationSufficient = await isSufficientDestination(
      destApi,
      destination,
      address,
      amount,
      originAsset,
      fixedDestinationFee
    )

    return {
      origin: {
        fee: fixedOriginFee,
        asset: resolvedFeeAsset ?? originAsset,
        sufficient: originSufficient
      },
      destination: {
        fee: fixedDestinationFee,
        asset: destAsset,
        sufficient: destinationSufficient
      }
    }
  }

  const originFeeDetails = await getOriginXcmFeeEstimate(options)

  const destinationFee = isExternalChain(destination)
    ? 0n
    : await getReverseTxFee(
        { ...options, api: destApi, destination },
        { location: originAsset.location, amount }
      )

  const destinationSufficient = await isSufficientDestination(
    destApi,
    destination,
    address,
    amount,
    originAsset,
    destinationFee
  )

  const destFeeDetails = {
    fee: destinationFee,
    asset: destAsset,
    sufficient: destinationSufficient
  }

  return {
    origin: originFeeDetails,
    destination: destFeeDetails
  }
}
