import { chains } from '../constants'

/**
 * Retrieves the chain instance for a given chain.
 *
 * @param chain - The chain identifier.
 * @returns The chain instance
 */
export const getChain = <TApi, TRes, T extends keyof ReturnType<typeof chains>>(
  chain: T
): ReturnType<typeof chains<TApi, TRes>>[T] => {
  const nodeMap = chains<TApi, TRes>()
  return nodeMap[chain]
}
