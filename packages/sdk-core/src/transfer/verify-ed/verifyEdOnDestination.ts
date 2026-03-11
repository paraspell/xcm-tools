import type { TVerifyEdOnDestinationOptions } from '../../types'
import { verifyEdOnDestinationInternal } from './verifyEdOnDestinationInternal'

export const verifyEdOnDestination = async <TApi, TRes, TSigner>(
  options: TVerifyEdOnDestinationOptions<TApi, TRes, TSigner>
) => {
  const { api } = options
  try {
    return await verifyEdOnDestinationInternal(options)
  } finally {
    await api.disconnect()
  }
}
