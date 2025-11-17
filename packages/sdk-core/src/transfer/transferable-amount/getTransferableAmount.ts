import {
  findAssetInfoOrThrow,
  findNativeAssetInfoOrThrow,
  getEdFromAssetOrThrow,
  isAssetEqual
} from '@paraspell/assets'
import { replaceBigInt } from '@paraspell/sdk-common'

import { getAssetBalanceInternal } from '../../balance'
import { InvalidParameterError } from '../../errors'
import type { TGetTransferableAmountOptions } from '../../types'
import { abstractDecimals, validateAddress } from '../../utils'
import { getOriginXcmFee } from '../fees'
import { resolveFeeAsset } from '../utils'

export const getTransferableAmountInternal = async <TApi, TRes>({
  api,
  senderAddress,
  origin: chain,
  destination,
  currency,
  buildTx,
  feeAsset
}: TGetTransferableAmountOptions<TApi, TRes>): Promise<bigint> => {
  validateAddress(api, senderAddress, chain, false)

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, chain, destination, currency)
    : undefined

  const asset = findAssetInfoOrThrow(chain, currency, null)

  const amount = abstractDecimals(currency.amount, asset.decimals, api)

  const balance = await getAssetBalanceInternal({
    api,
    address: senderAddress,
    chain,
    asset
  })

  const ed = getEdFromAssetOrThrow(asset)

  const nativeAssetInfo = findNativeAssetInfoOrThrow(chain)
  const isNativeAsset = isAssetEqual(nativeAssetInfo, asset)

  const paysOriginInSendingAsset =
    (!resolvedFeeAsset && isNativeAsset) ||
    (resolvedFeeAsset && isAssetEqual(resolvedFeeAsset, asset))

  let feeToSubtract = 0n

  if (paysOriginInSendingAsset) {
    const { fee } = await getOriginXcmFee({
      api,
      buildTx,
      origin: chain,
      destination: chain,
      senderAddress,
      feeAsset,
      currency: {
        ...currency,
        amount
      },
      disableFallback: false
    })

    if (fee === undefined) {
      throw new InvalidParameterError(
        `Cannot get origin xcm fee for currency ${JSON.stringify(currency, replaceBigInt)} on chain ${chain}.`
      )
    }
    feeToSubtract = fee
  }

  const transferable = balance - ed - feeToSubtract

  return transferable > 0n ? transferable : 0n
}

export const getTransferableAmount = async <TApi, TRes>(
  options: TGetTransferableAmountOptions<TApi, TRes>
): Promise<bigint> => {
  const { api } = options
  api.setDisconnectAllowed(false)
  try {
    return await getTransferableAmountInternal(options)
  } finally {
    api.setDisconnectAllowed(true)
    await api.disconnect()
  }
}
