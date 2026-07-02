import { isAssetEqual, type TAsset } from '@paraspell/assets'
import type { TChain } from '@paraspell/sdk-common'

import type { TCreateTransferXcmOptions } from '../../../types'
import { createAsset } from '../../asset'
import { localizeLocation } from '../../location'

export type TExecuteContext<TCustomChain extends string = never> = {
  amount: bigint
  asset: TAsset
  assetLocalized: TAsset
  assetLocalizedToDest: TAsset
  assetLocalizedToReserve: TAsset
  feeAsset?: TAsset
  feeAssetLocalized?: TAsset
  feeAssetLocalizedToDest?: TAsset
  feeAssetLocalizedToReserve?: TAsset
  reserveChain: TChain | TCustomChain
}

export const prepareExecuteContext = <TApi, TRes, TSigner, TCustomChain extends string = never>({
  api,
  chain,
  destChain,
  assetInfo,
  feeAssetInfo,
  fees: { originFee },
  version
}: TCreateTransferXcmOptions<TApi, TRes, TSigner, TCustomChain>): TExecuteContext<TCustomChain> => {
  const amount = assetInfo.amount
  const reserveChain = api.getAssetReserveChain(chain, assetInfo.location)

  const asset = createAsset(version, amount, assetInfo.location)

  const assetLocalized = createAsset(
    version,
    amount,
    api.localizeLocation(chain, assetInfo.location)
  )
  const assetLocalizedToDest = createAsset(
    version,
    amount,
    localizeLocation(destChain, assetInfo.location)
  )
  const assetLocalizedToReserve = createAsset(
    version,
    amount,
    api.localizeLocation(reserveChain ?? chain, assetInfo.location)
  )

  const feeAsset =
    feeAssetInfo && !isAssetEqual(assetInfo, feeAssetInfo)
      ? createAsset(version, originFee, feeAssetInfo.location)
      : undefined

  const feeAssetLocalized =
    feeAssetInfo && !isAssetEqual(assetInfo, feeAssetInfo)
      ? createAsset(version, originFee, api.localizeLocation(chain, feeAssetInfo.location))
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
          api.localizeLocation(reserveChain ?? chain, feeAssetInfo.location)
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
