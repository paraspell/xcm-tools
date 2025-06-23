import type { TCreateTransferXcmOptions } from '../../../types'
import { addXcmVersionHeader } from '../../addXcmVersionHeader'
import { createBaseExecuteXcm } from './createBaseExecuteXcm'
import { prepareCommonExecuteXcm } from './prepareCommonExecuteXcm'

export const createDirectExecuteXcm = <TApi, TRes>(
  options: TCreateTransferXcmOptions<TApi, TRes>
) => {
  const { version } = options

  const { prefix, depositInstruction } = prepareCommonExecuteXcm(options)

  const baseXcm = createBaseExecuteXcm({
    ...options,
    suffixXcm: [depositInstruction]
  })

  const fullXcm = [...prefix, ...baseXcm]
  return addXcmVersionHeader(fullXcm, version)
}
