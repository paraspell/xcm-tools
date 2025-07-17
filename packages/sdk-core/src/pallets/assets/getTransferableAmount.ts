import {
  findAssetForNodeOrThrow,
  getExistentialDepositOrThrow,
  getNativeAssetSymbol,
  isAssetEqual
} from '@paraspell/assets'
import { replaceBigInt } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../errors'
import { resolveFeeAsset } from '../../transfer/utils/resolveFeeAsset'
import type { TGetTransferableAmountOptions } from '../../types/TBalance'
import { validateAddress } from '../../utils/validateAddress'
import { attemptDryRunFee } from './attemptDryRunFee'
import { getAssetBalanceInternal } from './balance/getAssetBalance'

export const getTransferableAmountInternal = async <TApi, TRes>({
  api,
  senderAddress,
  origin: node,
  destination,
  currency,
  builder,
  feeAsset
}: TGetTransferableAmountOptions<TApi, TRes>): Promise<bigint> => {
  validateAddress(senderAddress, node, false)

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, node, destination, currency)
    : undefined

  const asset = findAssetForNodeOrThrow(node, currency, null)

  const balance = await getAssetBalanceInternal({
    api,
    address: senderAddress,
    node,
    currency
  })

  const ed = getExistentialDepositOrThrow(node, currency)

  const isNativeAsset = getNativeAssetSymbol(node) === asset.symbol

  const shouldSubstractFee =
    isNativeAsset ||
    (node === 'AssetHubPolkadot' && resolvedFeeAsset && isAssetEqual(resolvedFeeAsset, asset))

  let feeToSubtract = 0n

  if (shouldSubstractFee) {
    const { fee } = await attemptDryRunFee({
      api,
      builder,
      origin: node,
      destination: node,
      senderAddress,
      feeAsset,
      currency,
      disableFallback: false
    })

    if (fee === undefined) {
      throw new InvalidParameterError(
        `Cannot get origin xcm fee for currency ${JSON.stringify(currency, replaceBigInt)} on node ${node}.`
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
