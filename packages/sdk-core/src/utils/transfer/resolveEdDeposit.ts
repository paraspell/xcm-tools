import { extractAssetLocation } from '@paraspell/assets'
import { deepEqual, isExternalChain } from '@paraspell/sdk-common'

import { FEE_PADDING } from '../../transfer/type-and-then/computeFees'
import type { TQueriedAmount, TResolveEdDepositOptions } from '../../types'
import { padValueBy } from '../fees/padFee'
import { isAssetSufficient } from './isAssetSufficient'

export const resolveEdDeposit = async <TApi, TRes, TSigner, TCustomChain extends string = never>({
  origin,
  dest: { api: destApi, chain: destChain },
  assetInfo,
  overriddenAsset,
  feeAssetLocation,
  recipient
}: TResolveEdDepositOptions<TApi, TRes, TSigner, TCustomChain>): Promise<bigint | undefined> => {
  if (isExternalChain(destChain) || typeof recipient !== 'string') return undefined

  const nativeAsset = destApi.findNativeAssetInfoOrThrow(destChain)
  const nativeLocation = origin.api.localizeLocation(destChain, nativeAsset.location)
  const feeLocation = origin.api.localizeLocation(destChain, feeAssetLocation, origin.chain)

  const isFeeNative = deepEqual(feeLocation, nativeLocation)

  if (!isFeeNative && !destChain.startsWith('AssetHub')) return undefined

  const { providers } = await destApi.queryState<{ providers: number }>({
    module: 'System',
    method: 'Account',
    params: [recipient]
  })

  if (providers > 0) return undefined

  const destAssets = (
    overriddenAsset?.map(asset => extractAssetLocation(asset)) ?? [assetInfo.location]
  ).map(location => origin.api.findAssetOnDestOrThrow(origin.chain, destChain, { location }))

  const sufficiency = await Promise.all(
    destAssets.map(asset => isAssetSufficient(destApi, destChain, asset))
  )

  if (sufficiency.every(Boolean)) return undefined

  const ed = BigInt(nativeAsset.existentialDeposit)

  if (isFeeNative) return ed

  const feeAmount = await destApi.queryRuntimeApi<TQueriedAmount>({
    module: 'AssetConversionApi',
    method: 'quote_price_tokens_for_exact_tokens',
    params: [feeLocation, nativeLocation, ed, true]
  })

  return feeAmount == null ? undefined : padValueBy(BigInt(feeAmount), FEE_PADDING)
}
