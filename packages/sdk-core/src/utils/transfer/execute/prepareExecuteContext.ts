import { type TAsset } from '@paraspell/assets'
import type { TChain } from '@paraspell/sdk-common'

import type { TCreateTransferXcmOptions } from '../../../types'
import { createAsset } from '../../asset'
import { localizeLocation } from '../../location'
import { getFeeAssetInfo } from '../getFeeAssetInfo'

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
  feeReserveChain?: TChain | TCustomChain
  reserveChain: TChain | TCustomChain
}

export const prepareExecuteContext = <TApi, TRes, TSigner, TCustomChain extends string = never>({
  api,
  chain,
  destChain,
  assetInfo,
  feeAssetInfo,
  fees: { originFee, reserveFee, destFee },
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

  const resolvedFeeAssetInfo = getFeeAssetInfo(assetInfo, feeAssetInfo)
  const feeAssetTotal = originFee + reserveFee + destFee

  const feeAsset =
    resolvedFeeAssetInfo && createAsset(version, feeAssetTotal, resolvedFeeAssetInfo.location)

  const feeAssetLocalized =
    resolvedFeeAssetInfo &&
    createAsset(version, feeAssetTotal, api.localizeLocation(chain, resolvedFeeAssetInfo.location))

  const feeAssetLocalizedToDest =
    resolvedFeeAssetInfo &&
    createAsset(version, destFee, localizeLocation(destChain, resolvedFeeAssetInfo.location))

  const feeAssetLocalizedToReserve =
    resolvedFeeAssetInfo &&
    createAsset(
      version,
      reserveFee,
      api.localizeLocation(reserveChain ?? chain, resolvedFeeAssetInfo.location)
    )

  const feeReserveChain =
    resolvedFeeAssetInfo && api.getAssetReserveChain(chain, resolvedFeeAssetInfo.location)

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
    feeReserveChain,
    reserveChain
  }
}
