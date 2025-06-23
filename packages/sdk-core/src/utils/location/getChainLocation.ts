import { Parents, type TMultiLocation, type TNodeWithRelayChains } from '@paraspell/sdk-common'

import { getParaId } from '../../nodes/config'

export const getChainLocation = (chain: TNodeWithRelayChains): TMultiLocation => {
  const interior =
    chain === 'Polkadot'
      ? 'Here'
      : {
          X1: [
            {
              Parachain: getParaId(chain)
            }
          ]
        }

  return {
    parents: Parents.ONE,
    interior
  }
}
