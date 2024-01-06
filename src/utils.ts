// Contains important call creation utils (Selection of fees,formating of header and more.. )

import { ApiPromise, WsProvider } from '@polkadot/api'
import { ethers } from 'ethers'
import { prodRelayPolkadot, prodRelayKusama } from '@polkadot/apps-config/endpoints'
import {
  type TNode,
  type TPallet,
  type TScenario,
  type TSerializedApiCall,
  Version,
  type Extrinsic,
  type TNodeWithRelayChains
} from './types'
import { nodes } from './maps/consts'
import type ParachainNode from './nodes/ParachainNode'
import { type HexString } from '@polkadot/util/types'

export const createAccID = (api: ApiPromise, account: string): HexString => {
  console.log('Generating AccountId32 address')
  return api.createType('AccountId32', account).toHex()
}

export const getFees = (scenario: TScenario): number => {
  if (scenario === 'ParaToRelay') {
    console.log('Asigning fees for transfer to Relay chain')
    return 4600000000
  } else if (scenario === 'ParaToPara') {
    console.log('Asigning fees for transfer to another Parachain chain')
    return 399600000000
  }
  throw new Error(`Fees for scenario ${scenario} are not defined.`)
}

export const generateAddressPayload = (
  api: ApiPromise,
  scenario: TScenario,
  pallet: TPallet | null,
  recipientAddress: string,
  version: Version,
  nodeId: number | undefined
): any => {
  const isEthAddress = ethers.utils.isAddress(recipientAddress)

  if (scenario === 'ParaToRelay') {
    return {
      [version]: {
        parents: pallet === 'XTokens' ? 1 : 0,
        interior: {
          X1: {
            AccountId32: {
              ...(version === Version.V1 && { network: 'any' }),
              id: createAccID(api, recipientAddress)
            }
          }
        }
      }
    }
  }

  if (scenario === 'ParaToPara' && pallet === 'XTokens') {
    return {
      [version]: {
        parents: 1,
        interior: {
          X2: [
            {
              Parachain: nodeId
            },
            {
              [isEthAddress ? 'AccountKey20' : 'AccountId32']: {
                ...(version === Version.V1 && { network: 'any' }),
                ...(isEthAddress
                  ? { key: recipientAddress }
                  : { id: createAccID(api, recipientAddress) })
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
        parents: 0,
        interior: {
          X1: {
            [isEthAddress ? 'AccountKey20' : 'AccountId32']: {
              ...(version === Version.V1 && { network: 'any' }),
              ...(isEthAddress
                ? { key: recipientAddress }
                : { id: createAccID(api, recipientAddress) })
            }
          }
        }
      }
    }
  }

  return {
    V3: {
      parents: 0,
      interior: {
        X1: {
          [isEthAddress ? 'AccountKey20' : 'AccountId32']: {
            ...(isEthAddress
              ? { key: recipientAddress }
              : { id: createAccID(api, recipientAddress) })
          }
        }
      }
    }
  }
}

export const getNode = (node: TNode): ParachainNode => {
  return nodes[node]
}

export const getNodeEndpointOption = (node: TNode): any => {
  const { type, name } = getNode(node)
  const { linked } = type === 'polkadot' ? prodRelayPolkadot : prodRelayKusama
  return linked !== undefined ? linked.find((o: any) => o.info === name) : undefined
}

export const getAllNodeProviders = (node: TNode): string[] => {
  const { providers } = getNodeEndpointOption(node) ?? {}
  if (providers.length < 1) {
    throw new Error(`Node ${node} does not have any providers.`)
  }
  return Object.values(providers ?? [])
}

export const getNodeProvider = (node: TNode): string => getNode(node).getProvider()

export const createApiInstance = async (wsUrl: string): Promise<ApiPromise> => {
  const wsProvider = new WsProvider(wsUrl)
  return await ApiPromise.create({ provider: wsProvider })
}

export const createApiInstanceForNode = async (node: TNodeWithRelayChains): Promise<ApiPromise> => {
  if (node === 'Polkadot' || node === 'Kusama') {
    const endpointOption = node === 'Polkadot' ? prodRelayPolkadot : prodRelayKusama
    const wsUrl = Object.values(endpointOption.providers)[1]
    return await createApiInstance(wsUrl)
  }
  return await getNode(node).createApiInstance()
}

export const lowercaseFirstLetter = (str: string): string =>
  str.charAt(0).toLowerCase() + str.slice(1)

export const callPolkadotJsTxFunction = (
  api: ApiPromise,
  { module, section, parameters }: TSerializedApiCall
): Extrinsic => api.tx[module][section](...parameters)
