import { findNativeAssetInfoOrThrow } from '@paraspell/assets'

import type { IPolkadotApi } from '../../api'
import { DOT_LOCATION } from '../../constants'
import { InvalidParameterError } from '../../errors'
import { getParaEthTransferFees } from '../../transfer'
import { assertHasLocation } from '../assertions'
import { padFeeBy } from './padFee'

export const getMythosOriginFee = async <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>
): Promise<bigint> => {
  const ahApi = api.clone()
  await ahApi.init('AssetHubPolkadot')

  const [bridgeFee, ahExecutionFee] = await getParaEthTransferFees(ahApi)

  const nativeAsset = findNativeAssetInfoOrThrow('Mythos')
  assertHasLocation(nativeAsset)

  const feeConverted = await ahApi.quoteAhPrice(
    DOT_LOCATION,
    nativeAsset.location,
    bridgeFee + ahExecutionFee
  )

  if (!feeConverted) {
    throw new InvalidParameterError(`Pool DOT -> ${nativeAsset.symbol} not found.`)
  }

  return padFeeBy(feeConverted, 10)
}
