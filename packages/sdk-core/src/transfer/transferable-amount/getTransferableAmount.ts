import type {
  TAssetInfo,
  TCurrencyCore,
  TCurrencyInputWithAmount,
  TSingleCurrencyInputWithAmount,
  WithComplexAmount,
  WithOptionalAmount
} from '@paraspell/assets'
import { getEdFromAssetOrThrow, isAssetEqual } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'
import { replaceBigInt } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { getAssetBalanceInternal } from '../../balance'
import { UnableToComputeError } from '../../errors'
import type { TGetTransferableAmountOptions, TPerAssetResult } from '../../types'
import { abstractDecimals, validateAddress } from '../../utils'
import { getOriginXcmFee } from '../fees'
import { resolveCurrency, resolveFeeAsset } from '../utils'
import { assertNotRawAssets } from '../utils/validationUtils'

const getOriginFeeOrThrow = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  {
    api,
    buildTx,
    origin: chain,
    sender,
    feeAsset,
    version,
    currency
  }: TGetTransferableAmountOptions<TApi, TRes, TSigner, TCustomChain, TCurrencyInputWithAmount>,
  feeCurrency: TCurrencyInputWithAmount
): Promise<bigint> => {
  const { fee } = await getOriginXcmFee({
    api,
    buildTx,
    origin: chain,
    destination: chain,
    sender,
    feeAsset,
    version,
    currency: feeCurrency,
    disableFallback: false
  })

  if (fee === undefined) {
    throw new UnableToComputeError(
      `Cannot get origin xcm fee for currency ${JSON.stringify(currency, replaceBigInt)} on chain ${chain}.`
    )
  }

  return fee
}

const computeTransferableAmount = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  sender: string,
  chain: TSubstrateChain,
  asset: TAssetInfo,
  fee: bigint
): Promise<bigint> => {
  const balance = await getAssetBalanceInternal({
    api,
    address: sender,
    chain,
    asset
  })

  const transferable = balance - getEdFromAssetOrThrow(asset) - fee

  return transferable > 0n ? transferable : 0n
}

const getTransferableAmountForAsset = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  options: TGetTransferableAmountOptions<
    TApi,
    TRes,
    TSigner,
    TCustomChain,
    TSingleCurrencyInputWithAmount
  >,
  resolvedFeeAsset: WithOptionalAmount<TAssetInfo> | undefined
): Promise<bigint> => {
  const { api, sender, origin: chain, currency } = options

  const asset = api.findAssetInfoOrThrow(chain, currency)

  const amount = abstractDecimals(currency.amount, asset.decimals, api)

  const nativeAssetInfo = api.findNativeAssetInfoOrThrow(chain)
  const isNativeAsset = isAssetEqual(nativeAssetInfo, asset)

  const paysOriginInSendingAsset =
    (!resolvedFeeAsset && isNativeAsset) ||
    (resolvedFeeAsset && isAssetEqual(resolvedFeeAsset, asset))

  const fee = paysOriginInSendingAsset
    ? await getOriginFeeOrThrow(options, { ...currency, amount })
    : 0n

  return computeTransferableAmount(api, sender, chain, asset, fee)
}

const getTransferableAmountForAssets = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  options: TGetTransferableAmountOptions<
    TApi,
    TRes,
    TSigner,
    TCustomChain,
    WithComplexAmount<TCurrencyCore>[]
  >,
  resolvedFeeAsset: WithOptionalAmount<TAssetInfo> | undefined
): Promise<bigint[]> => {
  const { api, sender, origin: chain, destination, currency } = options

  const { assets } = resolveCurrency(api, currency, resolvedFeeAsset, chain, destination)

  const fee = await getOriginFeeOrThrow(options, currency)

  return Promise.all(
    assets.map(asset =>
      computeTransferableAmount(api, sender, chain, asset, asset.isFeeAsset ? fee : 0n)
    )
  )
}

export const getTransferableAmountInternal = async <
  TApi,
  TRes,
  TSigner,
  TCurrency extends TCurrencyInputWithAmount,
  TCustomChain extends string = never
>(
  options: TGetTransferableAmountOptions<TApi, TRes, TSigner, TCustomChain, TCurrency>
): Promise<TPerAssetResult<TCurrency, bigint>> => {
  const { api, sender, origin: chain, destination, currency, feeAsset } = options

  validateAddress(api, sender, chain, false)

  assertNotRawAssets(currency)

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(api, feeAsset, chain, destination, currency)
    : undefined

  return (
    Array.isArray(currency)
      ? getTransferableAmountForAssets({ ...options, currency }, resolvedFeeAsset)
      : getTransferableAmountForAsset({ ...options, currency }, resolvedFeeAsset)
  ) as Promise<TPerAssetResult<TCurrency, bigint>>
}

export const getTransferableAmount = async <
  TApi,
  TRes,
  TSigner,
  TCurrency extends TCurrencyInputWithAmount,
  TCustomChain extends string = never
>(
  options: TGetTransferableAmountOptions<TApi, TRes, TSigner, TCustomChain, TCurrency>
): Promise<TPerAssetResult<TCurrency, bigint>> => {
  const { api } = options
  api.disconnectAllowed = false
  try {
    return await getTransferableAmountInternal(options)
  } finally {
    api.disconnectAllowed = true
    await api.disconnect()
  }
}
