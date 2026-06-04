import { createTransactInstructions } from '../../../pallets/polkadotXcm'
import type { TCreateTransferXcmOptions } from '../../../types'
import { addXcmVersionHeader } from '../../xcm-version'
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
  const { api, version, transactOptions, destChain, recipient } = options

  const { prefix, depositInstruction } = prepareCommonExecuteXcm(options)

  const transact = transactOptions?.call
    ? await createTransactInstructions(api, transactOptions, version, destChain, recipient)
    : []

  const baseXcm = createBaseExecuteXcm({
    ...options,
    suffixXcm: transact ? [...transact, depositInstruction] : [depositInstruction]
  })

  const fullXcm = [...prefix, ...baseXcm]
  return addXcmVersionHeader(fullXcm, version)
}
