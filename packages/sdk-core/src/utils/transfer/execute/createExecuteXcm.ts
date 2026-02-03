import { createTransactInstructions } from '../../../pallets/polkadotXcm'
import type { TCreateTransferXcmOptions } from '../../../types'
import { addXcmVersionHeader } from '../../xcm-version'
import { createBaseExecuteXcm } from './createBaseExecuteXcm'
import { prepareCommonExecuteXcm } from './prepareCommonExecuteXcm'

export const createDirectExecuteXcm = async <TApi, TRes, TSigner>(
  options: TCreateTransferXcmOptions<TApi, TRes, TSigner>
) => {
  const { api, version, transactOptions, destChain, recipientAddress } = options

  const { prefix, depositInstruction } = prepareCommonExecuteXcm(options)

  const transact = transactOptions?.call
    ? await createTransactInstructions(api, transactOptions, version, destChain, recipientAddress)
    : []

  const baseXcm = createBaseExecuteXcm({
    ...options,
    suffixXcm: transact ? [...transact, depositInstruction] : [depositInstruction]
  })

  const fullXcm = [...prefix, ...baseXcm]
  return addXcmVersionHeader(fullXcm, version)
}
