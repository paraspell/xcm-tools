import type { TAssetInfo } from '@paraspell/assets'
import {
  getEdFromAssetOrThrow,
  isAssetXcEqual,
  isSymbolMatch,
  normalizeSymbol
} from '@paraspell/assets'
import { isExternalChain, isSubstrateBridge } from '@paraspell/sdk-common'

import { getAssetBalanceInternal } from '../../balance'
import { DryRunFailedError, ScenarioNotSupportedError, UnableToComputeError } from '../../errors'
import type { TGetXcmFeeResult, TVerifyEdOnDestinationOptions } from '../../types'
import { abstractDecimals, validateAddress } from '../../utils'
import { getXcmFeeInternal } from '../fees'
import { resolveCurrency, resolveFeeAsset } from '../utils'
import { assertNotRawAssets } from '../utils/validationUtils'

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

export const verifyEdOnDestinationInternal = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  options: TVerifyEdOnDestinationOptions<TApi, TRes, TSigner, TCustomChain>
): Promise<boolean> => {
  const { api, buildTx, origin, destination, currency, sender, recipient, feeAsset, version } =
    options

  if (isExternalChain(destination)) return true

  validateAddress(api, recipient, destination, true)

  const isSubBridge = isSubstrateBridge(origin, destination)

  if (isSubBridge) {
    throw new ScenarioNotSupportedError(
      'Unable to verify the existential deposit for substrate bridge scenarios'
    )
  }

  assertNotRawAssets(currency)

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(api, feeAsset, origin, destination, currency)
    : undefined

  const destApi = api.clone()
  await destApi.init(destination)

  const resolvedAssets = Array.isArray(currency)
    ? resolveCurrency(api, currency, resolvedFeeAsset, origin, destination).assets.map(
        (asset, index) => ({ selector: currency[index], paysDestFee: !!asset.isFeeAsset })
      )
    : [{ selector: currency, paysDestFee: true }]

  const destAssets = resolvedAssets.map(({ selector, paysDestFee }) => {
    const destAsset = api.findAssetOnDestOrThrow(origin, destination, selector)

    return {
      destAsset,
      amount: abstractDecimals(selector.amount, destAsset.decimals, api),
      paysDestFee
    }
  })

  const [firstAsset] = destAssets
  const feeElement = destAssets.find(({ paysDestFee }) => paysDestFee) ?? firstAsset

  const xcmFeeResult = await getXcmFeeInternal({
    api,
    buildTx,
    origin,
    destination,
    sender,
    recipient,
    currency: Array.isArray(currency)
      ? currency
      : {
          ...currency,
          amount: feeElement.amount
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
    !isSymbolMatch(
      normalizeSymbol(feeElement.destAsset.symbol),
      normalizeSymbol(destFeeAsset.symbol)
    ) && destFeeType === 'paymentInfo'

  if (isUnableToCompute) {
    throw new UnableToComputeError(
      `The XCM fee could not be calculated because the origin or destination chain does not support DryRun.
       As a result, fee estimation is only available through PaymentInfo, which provides the cost in the native asset.
       This limitation restricts support to transfers involving the native asset of the Destination chain only.`
    )
  }

  const tx = await buildTx()
  const method = api.getMethod(tx)

  const isTypeAndThenMethod =
    method === 'transfer_assets_using_type_and_then' || method === 'transferAssetsUsingTypeAndThen'

  const verifyAsset = async ({ destAsset, amount, paysDestFee }: (typeof destAssets)[number]) => {
    const ed = getEdFromAssetOrThrow(destAsset)

    const balance = await getAssetBalanceInternal({
      address: recipient,
      chain: destination,
      api: destApi,
      asset: destAsset
    })

    const feeToSubtract = isTypeAndThenMethod
      ? calculateTotalXcmFee(destAsset, xcmFeeResult)
      : paysDestFee
        ? destFee
        : 0n

    return amount - feeToSubtract > (balance < ed ? ed : 0)
  }

  const results = await Promise.all(destAssets.map(verifyAsset))

  return results.every(Boolean)
}
