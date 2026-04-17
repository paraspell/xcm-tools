import { findNativeAssetInfoOrThrow } from '@paraspell/assets'

import type { PolkadotApi } from '../../api'
import { DOT_LOCATION } from '../../constants'
import { UnableToComputeError } from '../../errors'
import { getParaEthTransferFees } from '../../transfer'
import { padValueBy } from './padFee'

export const getMythosOriginFee = async <TApi, TRes, TSigner>(
  api: PolkadotApi<TApi, TRes, TSigner>
): Promise<bigint> => {
  const ahApi = api.clone()
  await ahApi.init('AssetHubPolkadot')

  const [bridgeFee, ahExecutionFee] = await getParaEthTransferFees(ahApi, false)

  const nativeAsset = findNativeAssetInfoOrThrow('Mythos')

  const feeConvertedRes = await ahApi.queryRuntimeApi<bigint | null>({
    module: 'AssetConversionApi',
    method: 'quote_price_exact_tokens_for_tokens',
    params: [DOT_LOCATION, nativeAsset.location, bridgeFee + ahExecutionFee, true]
  })

  const feeConverted = feeConvertedRes != null ? BigInt(feeConvertedRes) : undefined

  await ahApi.disconnect()

  if (!feeConverted) {
    throw new UnableToComputeError(`Pool DOT -> ${nativeAsset.symbol} not found.`)
  }

  return padValueBy(feeConverted, 10)
}
