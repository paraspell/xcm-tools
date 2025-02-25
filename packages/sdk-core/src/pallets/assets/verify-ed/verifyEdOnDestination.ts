import type { TVerifyEdOnDestinationOptions } from '../../../types'
import { verifyEdOnDestinationInternal } from './verifyEdOnDestinationInternal'

export const verifyEdOnDestination = async <TApi, TRes>(
  options: TVerifyEdOnDestinationOptions<TApi, TRes>
) => {
  const { api } = options
  try {
    return await verifyEdOnDestinationInternal(options)
  } finally {
    await api.disconnect()
  }
}
