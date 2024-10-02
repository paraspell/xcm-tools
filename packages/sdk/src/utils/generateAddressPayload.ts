import { ApiPromise } from '@polkadot/api'
import { Parents, TAddress, TMultiLocationHeader, TPallet, TScenario, Version } from '../types'
import { ethers } from 'ethers'
import { createX1Payload } from './createX1Payload'
import { createAccID } from '../utils'

export const generateAddressPayload = (
  api: ApiPromise,
  scenario: TScenario,
  pallet: TPallet | null,
  recipientAddress: TAddress,
  version: Version,
  nodeId: number | undefined
): TMultiLocationHeader => {
  const isMultiLocation = typeof recipientAddress === 'object'
  if (isMultiLocation) {
    return { [version]: recipientAddress }
  }

  const isEthAddress = ethers.isAddress(recipientAddress)

  if (scenario === 'ParaToRelay') {
    return {
      [version]: {
        parents: pallet === 'XTokens' ? Parents.ONE : Parents.ZERO,
        interior: createX1Payload(version, {
          AccountId32: {
            ...(version === Version.V1 && { network: 'any' }),
            id: createAccID(api, recipientAddress)
          }
        })
      }
    }
  }

  if (scenario === 'ParaToPara' && pallet === 'XTokens') {
    return {
      [version]: {
        parents: Parents.ONE,
        interior: {
          X2: [
            {
              Parachain: nodeId
            },
            isEthAddress
              ? {
                  AccountKey20: {
                    ...(version === Version.V1 && { network: 'any' }),
                    key: recipientAddress
                  }
                }
              : {
                  AccountId32: {
                    ...(version === Version.V1 && { network: 'any' }),
                    id: createAccID(api, recipientAddress)
                  }
                }
          ]
        }
      }
    }
  }

  if (scenario === 'ParaToPara' && pallet === 'PolkadotXcm') {
    return {
      [version]: {
        parents: Parents.ZERO,
        interior: createX1Payload(
          version,
          isEthAddress
            ? {
                AccountKey20: {
                  ...(version === Version.V1 && { network: 'any' }),
                  key: recipientAddress
                }
              }
            : {
                AccountId32: {
                  ...(version === Version.V1 && { network: 'any' }),
                  id: createAccID(api, recipientAddress)
                }
              }
        )
      }
    }
  }

  return {
    [version]: {
      parents: Parents.ZERO,
      interior: createX1Payload(
        version,
        isEthAddress
          ? { AccountKey20: { key: recipientAddress } }
          : { AccountId32: { id: createAccID(api, recipientAddress) } }
      )
    }
  }
}
