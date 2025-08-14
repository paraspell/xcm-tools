import {
  findAssetInfoOrThrow,
  getExistentialDepositOrThrow,
  getNativeAssetSymbol,
  isAssetEqual
} from '@paraspell/assets'
import { replaceBigInt } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../errors'
import { resolveFeeAsset } from '../../transfer/utils/resolveFeeAsset'
import type { TGetTransferableAmountOptions } from '../../types/TBalance'
import { abstractDecimals, validateAddress } from '../../utils'
import { attemptDryRunFee } from './attemptDryRunFee'
import { getAssetBalanceInternal } from './balance/getAssetBalance'

export const getTransferableAmountInternal = async <TApi, TRes>({
  api,
  senderAddress,
  origin: chain,
  destination,
  currency,
  builder,
  feeAsset
}: TGetTransferableAmountOptions<TApi, TRes>): Promise<bigint> => {
  validateAddress(senderAddress, chain, false)

  const resolvedFeeAsset = feeAsset
    ? resolveFeeAsset(feeAsset, chain, destination, currency)
    : undefined

  const asset = findAssetInfoOrThrow(chain, currency, null)

  const amount = abstractDecimals(currency.amount, asset.decimals, api)

  const balance = await getAssetBalanceInternal({
    api,
    address: senderAddress,
    chain: chain,
    currency
  })

  const ed = getExistentialDepositOrThrow(chain, currency)

  const isNativeAsset = getNativeAssetSymbol(chain) === asset.symbol

  const shouldSubstractFee =
    isNativeAsset ||
    (chain === 'AssetHubPolkadot' && resolvedFeeAsset && isAssetEqual(resolvedFeeAsset, asset))

  let feeToSubtract = 0n

  if (shouldSubstractFee) {
    const { fee } = await attemptDryRunFee({
      api,
      builder,
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
