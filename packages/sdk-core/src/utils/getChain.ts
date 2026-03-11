import { chains } from '../constants'

/**
 * Retrieves the chain instance for a given chain.
 *
 * @param chain - The chain identifier.
 * @returns The chain instance
 */
export const getChain = <TApi, TRes, TSigner, T extends keyof ReturnType<typeof chains>>(
  chain: T
): ReturnType<typeof chains<TApi, TRes, TSigner>>[T] => {
  const map = chains<TApi, TRes, TSigner>()
  return map[chain]
}
