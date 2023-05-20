//Contains important call creation utils (Selection of fees,formating of header and more.. )

import { ApiPromise, WsProvider } from '@polkadot/api'
import { ethers } from 'ethers'
import { prodRelayPolkadot, prodRelayKusama } from '@polkadot/apps-config/endpoints'
import { TNode, TScenario } from './types'
import { getRelayChainSymbol } from './pallets/assets'
import { nodes } from './maps/consts'
import ParachainNode from './nodes/ParachainNode'

export function createAccID(api: ApiPromise, account: string) {
  console.log('Generating AccountId32 address')
  return api.createType('AccountId32', account).toHex()
}

export function getFees(scenario: TScenario) {
  if (scenario === 'ParaToRelay') {
    console.log('Asigning fees for transfer to Relay chain')
    return 4600000000
  } else if (scenario === 'ParaToPara') {
    console.log('Asigning fees for transfer to another Parachain chain')
    return 399600000000
  }
  throw new Error(`Fees for scenario ${scenario} are not defined.`)
}

export function handleAddress(
  scenario: TScenario,
  pallet: string,
  api: ApiPromise,
  to: string,
  nodeId: number | undefined,
  node?: TNode
): any {
  if (scenario === 'ParaToRelay' && pallet === 'xTokens') {
    console.log('AccountId32 transfer')
    if (node === 'BifrostKusama') {
      return {
        V3: {
          parents: 1,
          interior: {
            X1: {
              AccountId32: {
                id: createAccID(api, to)
              }
            }
          }
        }
      }
    }
    return {
      V1: {
        parents: 1,
        interior: {
          X1: {
            AccountId32: {
              network: 'any',
              id: createAccID(api, to)
            }
          }
        }
      }
    }
  }

  if (scenario === 'ParaToPara' && pallet === 'xTokens') {
    if (ethers.utils.isAddress(to)) {
      console.log('AccountKey20 transfer')
      if (node === 'BifrostKusama') {
        return {
          V3: {
            parents: 0,
            interior: {
              X2: [
                {
                  Parachain: nodeId
                },
                {
                  AccountKey20: {
                    key: to
                  }
                }
              ]
            }
          }
        }
      }
      return {
        V1: {
          parents: 1,
          interior: {
            X2: [
              {
                Parachain: nodeId
              },
              {
                AccountKey20: {
                  network: 'Any',
                  key: to
                }
              }
            ]
          }
        }
      }
    } else {
      console.log('AccountId32 transfer')
      return {
        V1: {
          parents: 1,
          interior: {
            X2: [
              {
                Parachain: nodeId
              },
              {
                AccountId32: {
                  network: 'Any',
                  id: createAccID(api, to)
                }
              }
            ]
          }
        }
      }
    }
  }
  if (scenario === 'ParaToRelay' && pallet === 'polkadotXCM') {
    console.log('AccountId32 transfer')
    if (node === 'Statemine'){
      return {
        V3: {
          parents: 0,
          interior: {
            X1: {
              AccountId32: {
                id: createAccID(api, to)
              }
            }
          }
        }
      }
    }
    else{
    return {
      V1: {
        parents: 0,
        interior: {
          X1: {
            AccountId32: {
              network: 'any',
              id: createAccID(api, to)
            }
          }
        }
      }
    }}
  }

  if (scenario === 'ParaToPara' && pallet === 'polkadotXCM') {
    if (node === 'Quartz') {
      return {
        V0: {
          X1: {
            AccountId32: {
              network: 'Any',
              id: createAccID(api, to)
            }
          }
        }
      }
    }
    if (ethers.utils.isAddress(to)) {
      console.log('AccountKey20 transfer')
      if(node === 'Statemine'){
        return {
          V3: {
            parents: 0,
            interior: {
              X1: {
                AccountKey20: {
                  key: to
                }
              }
            }
          }
        }
      }
      else{
        return {
          V1: {
            parents: 0,
            interior: {
              X1: {
                AccountKey20: {
                  network: 'Any',
                  key: to
                }
              }
            }
          }
        }
      }
    } else {
      console.log('AccountId32 transfer')
      if(node === 'Statemine'){
        return {
          V3: {
            parents: 0,
            interior: {
              X1: {
                AccountId32: {
                  id: createAccID(api, to)
                }
              }
            }
          }
        }
      }
      else{
        return {
          V1: {
            parents: 0,
            interior: {
              X1: {
                AccountId32: {
                  network: 'Any',
                  id: createAccID(api, to)
                }
              }
            }
          }
        }
      }
    }
  }

  if (scenario === 'RelayToPara') {
    let asset  = getRelayChainSymbol(node!)

    if (ethers.utils.isAddress(to)) {
      console.log('AccountKey20 transfer')
      if(asset === 'KSM'){
        return {
          V3: {
            parents: 0,
            interior: {
              X1: {
                AccountKey20: {
                  key: to
                }
              }
            }
          }
        }
      }
      else{
        return {
          V1: {
            parents: 0,
            interior: {
              X1: {
                AccountKey20: {
                  network: 'Any',
                  key: to
                }
              }
            }
          }
        }
      }
    } else {
      console.log('AccountId32 transfer')
      if(asset === 'KSM'){
        return {
          V3: {
            parents: 0,
            interior: {
              X1: {
                AccountId32: {
                  id: createAccID(api, to)
                }
              }
            }
          }
        }
      }
      else{
        return {
          V1: {
            parents: 0,
            interior: {
              X1: {
                AccountId32: {
                  network: 'Any',
                  id: createAccID(api, to)
                }
              }
            }
          }
        }
      }
    }
  }
}

export function createCurrencySpecification(
  amount: any,
  scenario: TScenario,
  node?: TNode,
  cur?: number | string
) {
  if (scenario === 'ParaToRelay') {
    console.log('polkadotXCM transfer in native currency to Relay chain')
    if(node === 'Statemine'){
      return {
        V3: [
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
    else{
      return {
        V1: [
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
  }
  if (scenario === 'RelayToPara' || scenario === 'ParaToPara') {
    console.log('polkadotXCM Native currency to sender chain transfer')
    if (node === 'Quartz' && scenario === 'ParaToPara') {
      return {
        V0: [
          {
            ConcreteFungible: {
              id: null,
              amount
            }
          }
        ]
      }
    }

    if ((node === 'Darwinia' || node === 'Crab') && scenario === 'ParaToPara') {
      // Special case for Darwinia&Crab node
      return {
        V1: [
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
    } else if ((node === 'Statemint' || node === 'Statemine') && scenario === 'ParaToPara') {
      // Another specific case for Statemint & Statemine to send for example USDt
      if(node === 'Statemine'){
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
      else{
        return {
          V1: [
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
    }

    // Otherwise
    let asset  = getRelayChainSymbol(node!)
    if(asset === 'KSM'){
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
    return {
      V1: [
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

export function createHeaderPolkadotXCM(scenario: TScenario, nodeId?: number, node?: TNode) {
  console.log('Generating header for polkadotXCM transfer')
  if (scenario === 'ParaToRelay') {
    if(node === 'Statemine'){
      return {
        V3: {
          parents: 1,
          interior: 'Here'
        }
      }
    }
    else{
      return {
        V1: {
          parents: 1,
          interior: 'Here'
        }
      }
    }
  }
  if (scenario === 'ParaToPara') {
    if (node === 'Quartz') {
      return {
        V0: {
          X2: [
            'Parent',
            {
              Parachain: nodeId
            }
          ]
        }
      }
    }
    return {
      V1: {
        parents: 1,
        interior: {
          X1: {
            Parachain: nodeId
          }
        }
      }
    }
  }
  if (scenario === 'RelayToPara') {
    //We check nodeID currency (IF KSM then V3 IF DOT then V1)
    let asset  = getRelayChainSymbol(node!)

    if(asset === 'KSM'){
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
    else{
      return {
        V1: {
          parents: 0,
          interior: {
            X1: {
              Parachain: nodeId
            }
          }
        }
      }
    }
  }
}

export function getNode(node: TNode): ParachainNode {
  return nodes[node]
}

export function getNodeEndpointOption(node: TNode) {
  const { type, name } = getNode(node)
  const { linked } = type === 'polkadot' ? prodRelayPolkadot : prodRelayKusama
  return linked
    ? linked.find(function (o) {
        return o.info === name
      })
    : undefined
}

export async function createApiInstance(wsUrl: string) {
  const wsProvider = new WsProvider(wsUrl)
  return await ApiPromise.create({ provider: wsProvider })
}

export const lowercaseFirstLetter = (str: string) => str.charAt(0).toLowerCase() + str.slice(1)
