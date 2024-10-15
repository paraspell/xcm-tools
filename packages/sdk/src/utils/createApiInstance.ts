import { ApiPromise, WsProvider } from '@polkadot/api'
import type { TApiType } from '../types'

/**
 * Creates an API instance connected to a specified node.
 *
 * @param node - The node for which to create the API instance.
 * @returns A Promise that resolves to the API instance.
 */
export const createApiInstance = async <TApi extends TApiType = ApiPromise>(
  wsUrl: string
): Promise<TApi> => {
  const wsProvider = new WsProvider(wsUrl)
  return ApiPromise.create({ provider: wsProvider }) as Promise<TApi>
}
