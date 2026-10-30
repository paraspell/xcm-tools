import { createTransactInstructions } from '../../../pallets/polkadotXcm'
import type { TCreateTransferXcmOptions } from '../../../types'
import { addXcmVersionHeader } from '../../xcm-version'
import { createEdExchangeInstructions } from '../createEdExchangeInstructions'
import { getFeeAssetInfo } from '../getFeeAssetInfo'
import { createBaseExecuteXcm } from './createBaseExecuteXcm'
import { prepareCommonExecuteXcm } from './prepareCommonExecuteXcm'

export const createDirectExecuteXcm = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  options: TCreateTransferXcmOptions<TApi, TRes, TSigner, TCustomChain>
) => {
  const {
    api,
    version,
    transactOptions,
    destChain,
    recipient,
    assetInfo,
    feeAssetInfo,
    edDeposit
  } = options

  const { prefix, depositInstruction } = prepareCommonExecuteXcm(options)

  const transact = transactOptions?.call
    ? await createTransactInstructions(api, transactOptions, version, destChain, recipient)
    : []

  const resolvedFeeAssetInfo = getFeeAssetInfo(assetInfo, feeAssetInfo)

  const edExchangeInstructions =
    edDeposit === undefined
      ? []
      : createEdExchangeInstructions(
          api,
          destChain,
          version,
          api.localizeLocation(destChain, (resolvedFeeAssetInfo ?? assetInfo).location),
          !resolvedFeeAssetInfo
        )

  const baseXcm = createBaseExecuteXcm({
    ...options,
    suffixXcm: [...transact, ...edExchangeInstructions, depositInstruction]
  })

  const fullXcm = [...prefix, ...baseXcm]
  return addXcmVersionHeader(fullXcm, version)
}
