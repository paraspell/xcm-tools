import type { TAssetInfo } from '@paraspell/assets'
import {
  getEdFromAssetOrThrow,
  isAssetXcEqual,
  isSymbolMatch,
  normalizeSymbol
} from '@paraspell/assets'
import { findAssetOnDestOrThrow } from '@paraspell/assets'
import { isExternalChain, isSubstrateBridge } from '@paraspell/sdk-common'

import { getAssetBalanceInternal } from '../../balance'
import { DryRunFailedError, ScenarioNotSupportedError, UnableToComputeError } from '../../errors'
import type { TGetXcmFeeResult, TVerifyEdOnDestinationOptions } from '../../types'
import { abstractDecimals, validateAddress } from '../../utils'
import { getXcmFeeInternal } from '../fees'

export const calculateTotalXcmFee = (
  asset: TAssetInfo,
  feeResult: TGetXcmFeeResult<false>
): bigint => {
  const totalHopFee = feeResult.hops.reduce(
    (acc, hop) => (isAssetXcEqual(hop.result.asset, asset) ? acc + hop.result.fee : acc),
    0n
  )

  const destFee = isAssetXcEqual(feeResult.destination.asset, asset)
    ? feeResult.destination.fee
    : 0n

  return totalHopFee + destFee
}

export const verifyEdOnDestinationInternal = async <TApi, TRes, TSigner>(
  options: TVerifyEdOnDestinationOptions<TApi, TRes, TSigner>
) => {
  const { api, buildTx, origin, destination, currency, address, senderAddress, feeAsset, version } =
    options

  if (isExternalChain(destination)) return true

  validateAddress(api, address, destination, true)

  const isSubBridge = isSubstrateBridge(origin, destination)

  if (isSubBridge) {
    throw new ScenarioNotSupportedError(
      'Unable to verify the existential deposit for substrate bridge scenarios'
    )
  }

  const destApi = api.clone()
  await destApi.init(destination)

  const asset = findAssetOnDestOrThrow(origin, destination, currency)

  const amount = abstractDecimals(currency.amount, asset.decimals, api)

  const destAsset = findAssetOnDestOrThrow(origin, destination, currency)

  const ed = getEdFromAssetOrThrow(destAsset)

  const balance = await getAssetBalanceInternal({
    address,
    chain: destination,
    api: destApi,
    asset: destAsset
  })

  const xcmFeeResult = await getXcmFeeInternal({
    api,
    buildTx,
    origin,
    destination,
    senderAddress,
    address,
    currency: {
      ...currency,
      amount
    },
    version,
    feeAsset,
    disableFallback: false
  })

  const {
    origin: { dryRunError },
    hops,
    destination: {
      fee: destFee,
      feeType: destFeeType,
      asset: destFeeAsset,
      dryRunError: destDryRunError
    }
  } = xcmFeeResult

  if (dryRunError) {
    throw new DryRunFailedError(dryRunError, 'origin')
  }

  const erroredHop = hops.find(hop => hop.result.dryRunError)
  const hopError = erroredHop?.result.dryRunError
  if (hopError) {
    throw new DryRunFailedError(hopError, erroredHop.chain)
  }

  if (destDryRunError) {
    throw new UnableToComputeError(
      `Unable to compute fee for the destination asset. Destination dry run error: ${destDryRunError}`
    )
  }

  const isUnableToCompute =
    !isSymbolMatch(normalizeSymbol(destAsset.symbol), normalizeSymbol(destFeeAsset.symbol)) &&
    destFeeType === 'paymentInfo'

  if (isUnableToCompute) {
    throw new UnableToComputeError(
      `The XCM fee could not be calculated because the origin or destination chain does not support DryRun.
       As a result, fee estimation is only available through PaymentInfo, which provides the cost in the native asset.
       This limitation restricts support to transfers involving the native asset of the Destination chain only.`
    )
  }

  const tx = await buildTx()

  const totalFee = calculateTotalXcmFee(asset, xcmFeeResult)
  const method = api.getMethod(tx)

  let feeToSubtract: bigint

  if (
    method === 'transfer_assets_using_type_and_then' ||
    method === 'transferAssetsUsingTypeAndThen'
  ) {
    feeToSubtract = totalFee
  } else {
    feeToSubtract = destFee
  }

  return amount - feeToSubtract > (balance < ed ? ed : 0)
}
