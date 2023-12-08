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
  type Extrinsic
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

// TODO: Refactor this function
export const createCurrencySpecification = (
  amount: string,
  scenario: TScenario,
  version: Version,
  node?: TNode,
  cur?: number | string
): any => {
  if (scenario === 'ParaToRelay') {
    return {
      [version]: [
        {
          id: {
            Concrete: {
              parents: 1,
              interior: 'Here'
            }
          },
          fun: {
            Fungible: amount
          }
        }
      ]
    }
  }

  if (scenario === 'RelayToPara' || scenario === 'ParaToPara') {
    console.log('polkadotXCM Native currency to sender chain transfer')
    if ((node === 'Darwinia' || node === 'Crab') && scenario === 'ParaToPara') {
      // Special case for Darwinia&Crab node
      return {
        V3: [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X1: {
                    PalletInstance: 5
                  }
                }
              }
            },
            fun: {
              Fungible: amount
            }
          }
        ]
      }
    } else if (
      (node === 'AssetHubPolkadot' || node === 'AssetHubKusama') &&
      scenario === 'ParaToPara'
    ) {
      // Another specific case for AssetHubPolkadot & AssetHubKusama to send for example USDt
      return {
        V3: [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: {
                  X2: [
                    {
                      PalletInstance: 50
                    },
                    {
                      GeneralIndex: cur
                    }
                  ]
                }
              }
            },
            fun: {
              Fungible: amount
            }
          }
        ]
      }
    }

    if (scenario === 'ParaToPara' && node === 'Robonomics') {
      return {
        [version]: [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: 'Here'
              }
            },
            fun: {
              Fungible: amount
            }
          }
        ]
      }
    }

    // Otherwise
    return {
      V3: [
        {
          id: {
            Concrete: {
              parents: 0,
              interior: 'Here'
            }
          },
          fun: {
            Fungible: amount
          }
        }
      ]
    }
  }
}

export const createHeaderPolkadotXCM = (
  scenario: TScenario,
  version: Version,
  nodeId?: number
): any => {
  if (scenario === 'ParaToRelay') {
    return {
      [version]: {
        parents: 1,
        interior: 'Here'
      }
    }
  }

  if (scenario === 'ParaToPara') {
    return {
      [version]: {
        parents: 1,
        interior: {
          X1: {
            Parachain: nodeId
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
          Parachain: nodeId
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

  // TMP Fix because some nodes don't have providers in endpoint options
  if (node === 'Kylin') {
    return {
      info: 'kylin',
      paraId: 2052,
      providers: {
        'Kylin Network': 'wss://polkadot.kylin-node.co.uk'
      }
    }
  }

  return linked !== undefined ? linked.find((o: any) => o.info === name) : undefined
}

export const getAllNodeProviders = (node: TNode): string[] => {
  const { providers } = getNodeEndpointOption(node) ?? {}
  return Object.values(providers ?? [])
}

export const getNodeProvider = (node: TNode): string | null => {
  const providers = getAllNodeProviders(node)
  return providers.length > 0 ? providers[0] : null
}

export const createApiInstance = async (wsUrl: string): Promise<ApiPromise> => {
  const wsProvider = new WsProvider(wsUrl)
  return await ApiPromise.create({ provider: wsProvider })
}

export const lowercaseFirstLetter = (str: string): string =>
  str.charAt(0).toLowerCase() + str.slice(1)

export const callPolkadotJsTxFunction = (
  api: ApiPromise,
  { module, section, parameters }: TSerializedApiCall
): Extrinsic => api.tx[module][section](...parameters)
