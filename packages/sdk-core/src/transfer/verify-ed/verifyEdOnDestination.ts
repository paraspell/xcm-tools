import type { TVerifyEdOnDestinationOptions } from '../../types'
import { verifyEdOnDestinationInternal } from './verifyEdOnDestinationInternal'

export const verifyEdOnDestination = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  options: TVerifyEdOnDestinationOptions<TApi, TRes, TSigner, TCustomChain>
) => {
  const { api } = options
  try {
    return await verifyEdOnDestinationInternal(options)
  } finally {
    await api.disconnect()
  }
}
