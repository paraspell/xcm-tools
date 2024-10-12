import { ApiPromise, WsProvider } from '@polkadot/api'

/**
 * Creates an API instance connected to a specified node.
 *
 * @param node - The node for which to create the API instance.
 * @returns A Promise that resolves to the API instance.
 */
export const createApiInstance = async (wsUrl: string): Promise<ApiPromise> => {
  const wsProvider = new WsProvider(wsUrl)
  return await ApiPromise.create({ provider: wsProvider })
}
