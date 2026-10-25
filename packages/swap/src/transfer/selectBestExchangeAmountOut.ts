import { SwapAmountOutOptions, SwapFeeDetails } from '../types'
import { selectBestExchangeAmountOutCommon } from './selectBestExchangeCommon'
import { prepareTransformedOptions } from './utils/prepareTransformedOptions'

export const selectBestExchangeAmountOut = async (
  options: SwapAmountOutOptions,
): Promise<SwapFeeDetails> => {
  const transformedOptions = prepareTransformedOptions(options)
  return selectBestExchangeAmountOutCommon(transformedOptions)
}
