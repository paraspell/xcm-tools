import { isAssetEqual, type TMultiAsset } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import type { TCreateBaseTransferXcmOptions } from '../../../types'
import { assertHasLocation } from '../../assertions'
import { localizeLocation } from '../../location'
import { createMultiAsset } from '../../multiAsset'
import { getAssetReserveChain } from './getAssetReserveChain'

export type TExecuteContext = {
  amount: bigint
  multiAsset: TMultiAsset
  multiAssetLocalized: TMultiAsset
  multiAssetLocalizedToDest: TMultiAsset
  multiAssetLocalizedToReserve: TMultiAsset
  feeMultiAsset?: TMultiAsset
  feeMultiAssetLocalized?: TMultiAsset
  reserveChain: TNodeDotKsmWithRelayChains
}

export const prepareExecuteContext = ({
  chain,
  destChain,
  asset,
  feeAsset,
  fees: { originFee },
  version
}: TCreateBaseTransferXcmOptions): TExecuteContext => {
  assertHasLocation(asset)
  if (feeAsset) assertHasLocation(feeAsset)

  const amount = asset.amount
  const reserveChain = getAssetReserveChain(chain, destChain, asset.multiLocation)

  const multiAsset = createMultiAsset(version, amount, asset.multiLocation)

  const multiAssetLocalized = createMultiAsset(
    version,
    amount,
    localizeLocation(chain, asset.multiLocation)
  )
  const multiAssetLocalizedToDest = createMultiAsset(
    version,
    amount,
    localizeLocation(destChain, asset.multiLocation)
  )
  const multiAssetLocalizedToReserve = createMultiAsset(
    version,
    amount,
    localizeLocation(reserveChain ?? chain, asset.multiLocation)
  )

  const feeMultiAsset =
    feeAsset && !isAssetEqual(asset, feeAsset)
      ? createMultiAsset(version, originFee, feeAsset.multiLocation)
      : undefined

  const feeMultiAssetLocalized =
    feeAsset && !isAssetEqual(asset, feeAsset)
      ? createMultiAsset(version, originFee, localizeLocation(chain, feeAsset.multiLocation))
      : undefined

  return {
    amount,
    multiAsset,
    multiAssetLocalized,
    multiAssetLocalizedToDest,
    multiAssetLocalizedToReserve,
    feeMultiAsset,
    feeMultiAssetLocalized,
    reserveChain
  }
}
