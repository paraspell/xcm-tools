import { Parents, type TMultiLocation } from '@paraspell/sdk-common'
import { ethers } from 'ethers'

import type { IPolkadotApi } from '../api/IPolkadotApi'
import { addXcmVersionHeader } from '../pallets/xcmPallet/utils'
import type { TAddress, TPallet, TScenario, TXcmVersioned } from '../types'
import { Version } from '../types'
import { createX1Payload } from './createX1Payload'

export const generateAddressPayload = <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  scenario: TScenario,
  pallet: TPallet | null,
  recipientAddress: TAddress,
  version: Version,
  nodeId: number | undefined
): TXcmVersioned<TMultiLocation> => {
  const isMultiLocation = typeof recipientAddress === 'object'
  if (isMultiLocation) {
    return addXcmVersionHeader(recipientAddress, version)
  }

  const isEthAddress = ethers.isAddress(recipientAddress)

  if (scenario === 'ParaToRelay') {
    return addXcmVersionHeader(
      {
        parents: pallet === 'XTokens' ? Parents.ONE : Parents.ZERO,
        interior: createX1Payload(version, {
          AccountId32: {
            ...(version === Version.V1 && { network: 'any' }),
            id: api.accountToHex(recipientAddress)
          }
        })
      },
      version
    )
  }

  if (scenario === 'ParaToPara' && pallet === 'XTokens') {
    return addXcmVersionHeader(
      {
        parents: Parents.ONE,
        interior: {
          X2: [
            {
              Parachain: nodeId
            },
            isEthAddress
              ? {
                  AccountKey20: {
                    ...((version === Version.V1 || version === Version.V2) && { network: 'any' }),
                    key: recipientAddress
                  }
                }
              : {
                  AccountId32: {
                    ...((version === Version.V1 || version === Version.V2) && { network: 'any' }),
                    id: api.accountToHex(recipientAddress)
                  }
                }
          ]
        }
      } as TMultiLocation,
      version
    )
  }

  if (scenario === 'ParaToPara' && pallet === 'PolkadotXcm') {
    return addXcmVersionHeader(
      {
        parents: Parents.ZERO,
        interior: createX1Payload(
          version,
          isEthAddress
            ? {
                AccountKey20: {
                  ...((version === Version.V1 || version === Version.V2) && { network: 'any' }),
                  key: recipientAddress
                }
              }
            : {
                AccountId32: {
                  ...((version === Version.V1 || version === Version.V2) && { network: 'any' }),
                  id: api.accountToHex(recipientAddress)
                }
              }
        )
      },
      version
    )
  }

  return addXcmVersionHeader(
    {
      parents: Parents.ZERO,
      interior: createX1Payload(
        version,
        isEthAddress
          ? { AccountKey20: { key: recipientAddress } }
          : { AccountId32: { id: api.accountToHex(recipientAddress) } }
      )
    },
    version
  )
}
