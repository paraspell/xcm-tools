import { isAssetEqual, type TAsset } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { TCreateBaseTransferXcmOptions } from '../../../types'
import { createAsset } from '../../asset'
import { getAssetReserveChain } from '../../chain'
import { localizeLocation } from '../../location'

export type TExecuteContext = {
  amount: bigint
  asset: TAsset
  assetLocalized: TAsset
  assetLocalizedToDest: TAsset
  assetLocalizedToReserve: TAsset
  feeAsset?: TAsset
  feeAssetLocalized?: TAsset
  feeAssetLocalizedToDest?: TAsset
  feeAssetLocalizedToReserve?: TAsset
  reserveChain: TSubstrateChain
}

export const prepareExecuteContext = <TRes>({
  chain,
  destChain,
  assetInfo,
  feeAssetInfo,
  fees: { originFee },
  version
}: TCreateBaseTransferXcmOptions<TRes>): TExecuteContext => {
  const amount = assetInfo.amount
  const reserveChain = getAssetReserveChain(chain, assetInfo.location)

  const asset = createAsset(version, amount, assetInfo.location)

  const assetLocalized = createAsset(version, amount, localizeLocation(chain, assetInfo.location))
  const assetLocalizedToDest = createAsset(
    version,
    amount,
    localizeLocation(destChain, assetInfo.location)
  )
  const assetLocalizedToReserve = createAsset(
    version,
    amount,
    localizeLocation(reserveChain ?? chain, assetInfo.location)
  )

  const feeAsset =
    feeAssetInfo && !isAssetEqual(assetInfo, feeAssetInfo)
      ? createAsset(version, originFee, feeAssetInfo.location)
      : undefined

  const feeAssetLocalized =
    feeAssetInfo && !isAssetEqual(assetInfo, feeAssetInfo)
      ? createAsset(version, originFee, localizeLocation(chain, feeAssetInfo.location))
      : undefined

  const feeAssetLocalizedToDest =
    feeAssetInfo && !isAssetEqual(assetInfo, feeAssetInfo)
      ? createAsset(version, originFee, localizeLocation(destChain, feeAssetInfo.location))
      : undefined

  const feeAssetLocalizedToReserve =
    feeAssetInfo && !isAssetEqual(assetInfo, feeAssetInfo)
      ? createAsset(
          version,
          originFee,
          localizeLocation(reserveChain ?? chain, feeAssetInfo.location)
        )
      : undefined

  return {
    amount,
    asset,
    assetLocalized,
    assetLocalizedToDest,
    assetLocalizedToReserve,
    feeAsset,
    feeAssetLocalized,
    feeAssetLocalizedToDest,
    feeAssetLocalizedToReserve,
    reserveChain
  }
}
