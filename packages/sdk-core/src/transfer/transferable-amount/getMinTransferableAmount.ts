import type { TCurrencyInputWithAmount, TSingleCurrencyInputWithAmount } from '@paraspell/assets'
import { getEdFromAssetOrThrow, isAssetEqual } from '@paraspell/assets'

import { getAssetBalanceInternal } from '../../balance'
import { AmountTooLowError } from '../../errors'
import type { TGetMinTransferableAmountOptions, TPerAssetResult } from '../../types'
import { padValueBy, validateAddress } from '../../utils'
import { dryRunInternal } from '../dry-run'
import { getXcmFee as getXcmFeeInternal } from '../fees'
import { FEE_PADDING } from '../type-and-then/computeFees'
import { resolveCurrency, resolveFeeAsset } from '../utils'

const toSelectors = (currency: TCurrencyInputWithAmount): TSingleCurrencyInputWithAmount[] =>
  Array.isArray(currency) ? currency : [currency]

export const getMinTransferableAmountInternal = async <
  TApi,
  TRes,
  TSigner,
  TCurrency extends TCurrencyInputWithAmount,
  TCustomChain extends string = never
>({
  api,
  origin,
  sender,
  recipient,
  destination,
  currency,
  feeAsset,
  buildTx,
  builder,
  version
}: TGetMinTransferableAmountOptions<TApi, TRes, TSigner, TCustomChain, TCurrency>): Promise<
  TPerAssetResult<TCurrency, bigint>
> => {
  validateAddress(api, sender, origin, false)

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(api, feeAsset, origin, destination, currency)
    : undefined

  const { assets } = resolveCurrency(api, currency, resolvedFeeAsset, origin, destination)

  const isMulti = Array.isArray(currency)
  const selectors = toSelectors(currency)

  const toResult = (values: bigint[]) =>
    (isMulti ? values : values[0]) as TPerAssetResult<TCurrency, bigint>

  const destApi = api.clone()
  await destApi.init(destination)

  const nativeAssetInfo = api.findNativeAssetInfoOrThrow(origin)

  const result = await getXcmFeeInternal({
    api,
    origin,
    destination,
    buildTx,
    sender,
    recipient,
    currency: isMulti ? selectors : { ...selectors[0], amount: assets[0].amount },
    feeAsset,
    version,
    disableFallback: false
  })

  const minAmounts = await Promise.all(
    assets.map(async (asset, index) => {
      const destAsset = api.findAssetOnDestOrThrow(origin, destination, selectors[index])

      const destBalance = await getAssetBalanceInternal({
        api: destApi,
        address: recipient,
        chain: destination,
        asset: destAsset
      })

      const destEd = getEdFromAssetOrThrow(destAsset)

      const paysOriginInSendingAsset =
        (!resolvedFeeAsset && isAssetEqual(nativeAssetInfo, asset)) ||
        (resolvedFeeAsset && isAssetEqual(resolvedFeeAsset, asset))

      const originFee =
        result.origin && paysOriginInSendingAsset && isAssetEqual(result.origin.asset, asset)
          ? result.origin.fee
          : 0n

      const hopFeeTotal = result.hops.reduce((acc, hop) => {
        // only add if asset is equal
        return isAssetEqual(hop.result.asset, asset) ? acc + hop.result.fee : acc
      }, 0n)

      const destinationFee =
        result.destination && isAssetEqual(result.destination.asset, asset)
          ? result.destination.fee
          : 0n

      const edComponent = destBalance === 0n ? destEd : 0n

      return hopFeeTotal + destinationFee + originFee + edComponent + 1n
    })
  )

  const buildMinCurrency = (amounts: bigint[]): TCurrencyInputWithAmount =>
    isMulti
      ? selectors.map((item, index) => ({ ...item, amount: amounts[index] }))
      : { ...selectors[0], amount: amounts[0] }

  const createTx = async (amounts: bigint[]) => {
    const { tx } = await builder.currency(buildMinCurrency(amounts))['buildInternal']()
    return tx
  }

  let amounts = minAmounts

  let tx
  try {
    tx = await createTx(amounts)
  } catch (e) {
    if (e instanceof AmountTooLowError) {
      amounts = amounts.map(amount => padValueBy(amount, FEE_PADDING))
      try {
        tx = await createTx(amounts)
      } catch {
        return toResult(amounts.map(() => 0n))
      }
    }
  }

  const dryRunResult = await dryRunInternal({
    api,
    tx,
    origin,
    destination,
    sender,
    version,
    currency: buildMinCurrency(amounts),
    feeAsset
  })

  if (dryRunResult.failureReason) {
    return toResult(amounts.map(() => 0n))
  }

  return toResult(amounts)
}

export const getMinTransferableAmount = async <
  TApi,
  TRes,
  TSigner,
  TCurrency extends TCurrencyInputWithAmount,
  TCustomChain extends string = never
>(
  options: TGetMinTransferableAmountOptions<TApi, TRes, TSigner, TCustomChain, TCurrency>
): Promise<TPerAssetResult<TCurrency, bigint>> => {
  const { api } = options
  api.disconnectAllowed = false
  try {
    return await getMinTransferableAmountInternal(options)
  } finally {
    api.disconnectAllowed = true
    await api.disconnect()
  }
}
