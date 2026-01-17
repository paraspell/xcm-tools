import type { TChain, TExternalChain, TRelaychain } from '@paraspell/sdk-common'
import { PARACHAINS } from '@paraspell/sdk-common'

import { ETH_MAINNET_PARA_ID, ETH_TESTNET_PARA_ID, RELAYCHAIN_PARA_ID } from '../constants'
import { getChain } from '../utils'
import { getParaId } from './config'

/**
 * Retrieves the chain name corresponding to a specified parachain ID.
 *
 * @param paraId - The parachain ID.
 * @returns The chain name if found; otherwise, null.
 */
export const getTChain = (
  paraId: number,
  ecosystem: TRelaychain | TExternalChain
): TChain | null => {
  if (paraId === RELAYCHAIN_PARA_ID) return ecosystem

  if (paraId === ETH_MAINNET_PARA_ID) return 'Ethereum'
  if (paraId === ETH_TESTNET_PARA_ID) return 'EthereumTestnet'

  return (
    PARACHAINS.find(
      chain => getChain(chain).ecosystem === ecosystem && getParaId(chain) === paraId
    ) ?? null
  )
}
