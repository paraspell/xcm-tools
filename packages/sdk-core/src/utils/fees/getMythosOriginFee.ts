import { findNativeAssetInfoOrThrow } from '@paraspell/assets'

import type { IPolkadotApi } from '../../api'
import { DOT_LOCATION } from '../../constants'
import { UnableToComputeError } from '../../errors'
import { getParaEthTransferFees } from '../../transfer'
import { assertHasLocation } from '../assertions'
import { padValueBy } from './padFee'

export const getMythosOriginFee = async <TApi, TRes, TSigner>(
  api: IPolkadotApi<TApi, TRes, TSigner>
): Promise<bigint> => {
  const ahApi = api.clone()
  await ahApi.init('AssetHubPolkadot')

  const [bridgeFee, ahExecutionFee] = await getParaEthTransferFees(ahApi, false)

  const nativeAsset = findNativeAssetInfoOrThrow('Mythos')
  assertHasLocation(nativeAsset)

  const feeConverted = await ahApi.quoteAhPrice(
    DOT_LOCATION,
    nativeAsset.location,
    bridgeFee + ahExecutionFee
  )

  await ahApi.disconnect()

  if (!feeConverted) {
    throw new UnableToComputeError(`Pool DOT -> ${nativeAsset.symbol} not found.`)
  }

  return padValueBy(feeConverted, 10)
}
