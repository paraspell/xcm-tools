import { SwapAmountOutOptions } from '../types'
import { getBestAmountOutCommon } from './selectBestExchangeCommon'
import { prepareTransformedOptions } from './utils/prepareTransformedOptions'

export const getBestAmountOut = async (
  options: SwapAmountOutOptions,
): Promise<string> => {
  const transformedOptions = prepareTransformedOptions(options)
  return getBestAmountOutCommon(transformedOptions)
}
