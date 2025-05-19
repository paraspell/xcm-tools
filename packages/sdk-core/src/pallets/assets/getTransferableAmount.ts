import {
  findAssetForNodeOrThrow,
  getExistentialDeposit,
  getNativeAssetSymbol
} from '@paraspell/assets'

import { getOriginXcmFee } from '../../transfer'
import type { TGetTransferableAmountOptions } from '../../types/TBalance'
import { validateAddress } from '../../utils/validateAddress'
import { getAssetBalanceInternal } from './balance/getAssetBalance'

export const getTransferableAmountInternal = async <TApi, TRes>({
  api,
  senderAddress,
  node,
  currency,
  tx
}: TGetTransferableAmountOptions<TApi, TRes>): Promise<bigint> => {
  validateAddress(senderAddress, node, false)

  const asset = findAssetForNodeOrThrow(node, currency, null)

  const balance = await getAssetBalanceInternal({
    api,
    address: senderAddress,
    node,
    currency
  })

  const ed = getExistentialDeposit(node, currency)

  if (ed === null) {
    throw new Error(`Cannot get existential deposit for currency ${JSON.stringify(currency)}.`)
  }

  const edBN = BigInt(ed)

  const isNativeAsset = getNativeAssetSymbol(node) === asset.symbol

  let feeToSubtract = 0n

  if (isNativeAsset) {
    const { fee } = await getOriginXcmFee({
      api,
      tx,
      origin: node,
      destination: node,
      senderAddress,
      disableFallback: false
    })

    if (fee === undefined) {
      throw new Error(
        `Cannot get origin xcm fee for currency ${JSON.stringify(currency)} on node ${node}.`
      )
    }
    feeToSubtract = fee
  }

  const transferable = balance - edBN - feeToSubtract

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
