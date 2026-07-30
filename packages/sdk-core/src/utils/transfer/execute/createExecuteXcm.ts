import { createTransactInstructions } from '../../../pallets/polkadotXcm'
import type { TCreateTransferXcmOptions } from '../../../types'
import { createBeneficiaryLocation } from '../../location'
import { addXcmVersionHeader } from '../../xcm-version'
import { createBaseExecuteXcm } from './createBaseExecuteXcm'
import { createExecutionProgram } from './createExecutionProgram'
import { prepareCommonExecuteXcm } from './prepareCommonExecuteXcm'

export const createDirectExecuteXcm = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  options: TCreateTransferXcmOptions<TApi, TRes, TSigner, TCustomChain>
) => {
  const { api, version, transactOptions, destChain, recipient, sender } = options

  const { prefix, feePaymentAsset, depositInstruction } = prepareCommonExecuteXcm(options)

  const transact = transactOptions?.call
    ? await createTransactInstructions(api, transactOptions, version, destChain, recipient)
    : []

  const baseXcm = createBaseExecuteXcm({
    ...options,
    suffixXcm: transact ? [...transact, depositInstruction] : [depositInstruction]
  })

  const paidBaseXcm = createExecutionProgram({
    version,
    feeAsset: feePaymentAsset,
    executionFee: options.fees.byChain?.[options.chain],
    xcm: baseXcm,
    refundBeneficiary: createBeneficiaryLocation({
      api,
      address: sender ?? recipient,
      version
    })
  })

  const fullXcm = [...prefix, ...paidBaseXcm]
  return addXcmVersionHeader(fullXcm, version)
}
