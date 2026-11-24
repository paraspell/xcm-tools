import type { TCurrencyInputWithAmount, TSingleCurrencyInputWithAmount } from '@paraspell/assets'

import { getAssetBalanceInternal } from '../../balance'
import { AmountTooLowError } from '../../errors'
import type { TGetMinTransferableAmountOptions, TPerAssetResult } from '../../types'
import { padValueBy, validateAddress } from '../../utils'
import { dryRunInternal } from '../dry-run'
import { getXcmFee as getXcmFeeInternal } from '../fees'
import { FEE_PADDING } from '../type-and-then/computeFees'
import { resolveCurrency, resolveFeeAsset, usesOriginFeeAsset } from '../utils'

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

      const destEd = BigInt(destAsset.existentialDeposit)

      const originChainAsset = { chain: origin, asset }

      // The origin fee has to be covered on top of the transferred amount whenever it is
      // denominated in the transferred asset itself. A local transfer cannot carry an explicit
      // feeAsset, so usesOriginFeeAsset never matches there and the exact asset comparison is
      // needed as well.
      const originFeeAssetIsTransferredAsset = api.isAssetXcEqual(originChainAsset, {
        chain: origin,
        asset: result.origin.asset
      })

      const originFee =
        originFeeAssetIsTransferredAsset ||
        usesOriginFeeAsset(api, origin, currency, asset, resolvedFeeAsset, result.origin.asset)
          ? result.origin.fee
          : 0n

      const hopFeeTotal = result.hops.reduce(
        (acc, { chain, result: { asset: hopAsset, fee } }) =>
          api.isAssetXcEqual(originChainAsset, { chain, asset: hopAsset }) ? acc + fee : acc,
        0n
      )

      const destinationFee =
        result.destination &&
        api.isAssetXcEqual(originChainAsset, {
          chain: destination,
          asset: result.destination.asset
        })
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
    if (!(e instanceof AmountTooLowError)) throw e
    amounts = amounts.map(amount => padValueBy(amount, FEE_PADDING))
    try {
      tx = await createTx(amounts)
    } catch {
      return toResult(amounts.map(() => 0n))
    }
  }

  // A chain without the DryRunApi can never confirm the derived amount, so the verification
  // dry-run must not act as the arbiter of the result: without it every route to such a chain
  // would collapse to 0 even though fees and the destination existential deposit are known.
  const hasDryRunSupport = typeof api.hasDryRunSupport === 'function'

  if (!hasDryRunSupport || !api.hasDryRunSupport(origin) || !api.hasDryRunSupport(destination))
    return toResult(amounts)

  const dryRunAmounts = async (txToDryRun: TRes, currentAmounts: bigint[]) =>
    dryRunInternal({
      api,
      tx: txToDryRun,
      origin,
      destination,
      sender,
      version,
      currency: buildMinCurrency(currentAmounts),
      feeAsset
    })

  const dryRunResult = await dryRunAmounts(tx, amounts)

  if (dryRunResult.success) {
    return toResult(amounts)
  }

  // The quoted destination fee varies slightly with the transferred amount, so a minimum
  // derived from a quote on a different amount can still end up a few units short. Pad it and
  // retry once before giving up.
  amounts = amounts.map(amount => padValueBy(amount, FEE_PADDING))

  let paddedTx
  try {
    paddedTx = await createTx(amounts)
  } catch {
    return toResult(amounts.map(() => 0n))
  }

  const paddedDryRunResult = await dryRunAmounts(paddedTx, amounts)

  if (!paddedDryRunResult.success) {
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
