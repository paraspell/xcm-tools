import { isAssetEqual, type TAsset } from '@paraspell/assets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import type { TCreateBaseTransferXcmOptions } from '../../../types'
import { assertHasLocation } from '../../assertions'
import { createAsset } from '../../asset'
import { localizeLocation } from '../../location'
import { getAssetReserveChain } from './getAssetReserveChain'

export type TExecuteContext = {
  amount: bigint
  asset: TAsset
  assetLocalized: TAsset
  assetLocalizedToDest: TAsset
  assetLocalizedToReserve: TAsset
  feeAsset?: TAsset
  feeAssetLocalized?: TAsset
  reserveChain: TSubstrateChain
}

export const prepareExecuteContext = ({
  chain,
  destChain,
  assetInfo,
  feeAssetInfo,
  fees: { originFee },
  version
}: TCreateBaseTransferXcmOptions): TExecuteContext => {
  assertHasLocation(assetInfo)
  if (feeAssetInfo) assertHasLocation(feeAssetInfo)

  const amount = assetInfo.amount
  const reserveChain = getAssetReserveChain(chain, destChain, assetInfo.location)

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

  return {
    amount,
    asset,
    assetLocalized,
    assetLocalizedToDest,
    assetLocalizedToReserve,
    feeAsset,
    feeAssetLocalized,
    reserveChain
  }
}
