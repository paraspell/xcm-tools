import { ApiPromise, WsProvider } from '@polkadot/api'
import { ethers } from 'ethers'
import { prodRelayPolkadot, prodRelayKusama } from '@polkadot/apps-config/endpoints'
import { nodeToPallet } from './maps/PalletMap'
import { Extrinsic, TNode } from './types'
import { nodes } from './maps/consts'

export function createAccID(api: ApiPromise, account: string) {
  console.log('Generating AccountId32 address')
  return api.createType('AccountId32', account).toHex()
}

export function selectLimit(limit: number, isLimited: boolean) {
  if (isLimited) {
    return {
      Limited: limit
    }
  } else {
    return 'Unlimited'
  }
}

export function getFees(scenario: string) {
  if (scenario === 'ParaToRelay') {
    console.log('Asigning fees for transfer to Relay chain')
    return 4600000000
  } else if (scenario === 'ParaToPara') {
    console.log('Asigning fees for transfer to another Parachain chain')
    return 399600000000
  }
}

export function handleAddress(scenario: string, pallet: string, api: ApiPromise, to: string, nodeId: number): any {
  if (scenario === 'ParaToRelay' && pallet === 'xTokens') {
    console.log('AccountId32 transfer')
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
    }
  }

  if (scenario === 'ParaToPara' && pallet === 'polkadotXCM') {
    if (ethers.utils.isAddress(to)) {
      console.log('AccountKey20 transfer')
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
    } else {
      console.log('AccountId32 transfer')
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

  if (scenario === 'RelayToPara') {
    if (ethers.utils.isAddress(to)) {
      console.log('AccountKey20 transfer')
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
    } else {
      console.log('AccountId32 transfer')
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

export function createCurrencySpecification(amount: any, scenario: string) {
  if (scenario === 'ParaToRelay') {
    console.log('polkadotXCM transfer in native currency to Relay chain')
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
  if (scenario === 'RelayToPara' || scenario === 'ParaToPara') {
    console.log('polkadotXCM Native currency to sender chain transfer')
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

export function createHeaderPolkadotXCM(scenario: string, nodeId: number) {
  console.log('Generating header for polkadotXCM transfer')
  if (scenario === 'ParaToRelay') {
    return {
      V1: {
        parents: 1,
        interior: 'Here'
      }
    }
  }
  if (scenario === 'ParaToPara') {
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

export function getAvailableXCMPallet(origin: TNode) {
  if (!Object.prototype.hasOwnProperty.call(nodeToPallet, origin)) { return false }
  return nodeToPallet[origin]
}

export function constructXTokens(api: ApiPromise, origin: TNode, currencyID: number, currency: string, amount: any, addressSelection: any, fees: number): Extrinsic {
  switch (origin) {
    // Polkadot xTokens
    case 'Acala':
      console.log('Transferring tokens ' + currency + ' from Acala')
      return api.tx.xTokens.transfer({ Token: currency }, amount, addressSelection, fees) // Multiple asset options need addressing
    case 'BifrostPolkadot':
      console.log('Transferring ' + currency + ' tokens from BifrostPolkadot')
      return api.tx.xTokens.transfer({ Token: currency }, amount, addressSelection, fees) // Multiple asset options need addressing
    case 'Centrifuge':
      console.log('Transferring tokens from Centrifuge')
      return api.tx.xTokens.transfer('Native', amount, addressSelection, fees) // Multiple asset options needs addressing
    case 'Clover':
      console.log('Transferring tokens from Clover')
      return api.tx.xTokens.transfer('SelfReserve', amount, addressSelection, fees) // Multiple asset options needs addressing
    case 'HydraDX':
      console.log('Transferring ' + currencyID + 'tokens from HydraDX')
      return api.tx.xTokens.transfer(currencyID, amount, addressSelection, fees)
    case 'Interlay':
      console.log('Transferring ' + currency + 'tokens from Interlay')
      return api.tx.xTokens.transfer({ Token: currency }, amount, addressSelection, fees) // Multiple asset options needs addressing
    case 'Moonbeam':
      console.log('Transferring tokens from Moonbeam')
      return api.tx.xTokens.transfer('SelfReserve', amount, addressSelection, fees) // Multiple asset options needs addressing
    case 'Parallel':
      console.log('Transferring ' + currencyID + ' tokens from Parallel')
      return api.tx.xTokens.transfer(currencyID, amount, addressSelection, fees)
    case 'Litentry':
      console.log('Transferring ' + currencyID + ' tokens from Litentry')
      return api.tx.xTokens.transfer('SelfReserve', amount, addressSelection, fees)
    case 'Kylin':
      console.log('Transferring ' + currency + ' tokens from Kylin')
      return api.tx.ormlXTokens.transfer(currency, amount, addressSelection, fees)

    // Kusama xTokens
    case 'Altair':
      console.log('Transferring tokens from Altair')
      return api.tx.xTokens.transfer('Native', amount, addressSelection, fees) // Multiple asset options needs addressing
    case 'Amplitude':
      console.log('Transferring ' + currency + ' tokens from Amplitude')
      return api.tx.xTokens.transfer({ XCM: currency }, amount, addressSelection, fees)
    case 'Bajun':
      console.log('Transferring ' + currencyID + ' tokens from Bajun')
      return api.tx.xTokens.transfer(currencyID, amount, addressSelection, fees)
    case 'Basilisk':
      console.log('Transferring ' + currencyID + ' tokens from Basilisk')
      return api.tx.xTokens.transfer(currencyID, amount, addressSelection, fees)
    case 'BifrostKusama':
      console.log('Transferring ' + currency + ' tokens from BifrostKusama')
      return api.tx.xTokens.transfer({ Token: currency }, amount, addressSelection, fees) // Multiple asset options need addressing
    case 'Pioneer':
      console.log('Transferring tokens from Pioneer')
      return api.tx.xTokens.transfer('NativeToken', amount, addressSelection, fees) // Multiple asset options needs addressing
    case 'Calamari':
      console.log('Transferring ' + currencyID + ' tokens from Calamari')
      return api.tx.xTokens.transfer({ MantaCurrency: currencyID }, amount, addressSelection, fees) // Currently only option for XCM transfer
    case 'CrustShadow':
      console.log('Transferring tokens from CrustShadow')
      return api.tx.xTokens.transfer('SelfReserve', amount, addressSelection, fees) // Multiple asset options needs addressing
    case 'Dorafactory':
      console.log('Transferring ' + currency + ' tokens from DoraFactory')
      return api.tx.xTokens.transfer(currency, amount, addressSelection, fees)
    case 'Imbue':
      console.log('Transferring ' + currency + ' tokens from imbue')
      return api.tx.xTokens.transfer(currency, amount, addressSelection, fees)
    case 'Integritee':
      console.log('Transferring ' + currency + ' tokens from Integritee')
      return api.tx.xTokens.transfer(currency, amount, addressSelection, fees)
    case 'InvArchTinker':
      console.log('Transferring ' + currencyID + ' tokens from InvArch Tinker')
      return api.tx.xTokens.transfer(currencyID, amount, addressSelection, fees)
    case 'Karura':
      console.log('Transferring ' + currency + ' tokens from Karura')
      return api.tx.xTokens.transfer({ Token: currency }, amount, addressSelection, fees) // Multiple asset options need addressing
    case 'Kico':
      console.log('Transferring ' + currencyID + ' tokens from KICO')
      return api.tx.xTokens.transfer(currencyID, amount, addressSelection, fees)
    case 'Kintsugi':
      console.log('Transferring ' + currency + ' tokens from kintsugi')
      return api.tx.xTokens.transfer({ Token: currency }, amount, addressSelection, fees) // Multiple asset options need addressing
    case 'Listen':
      console.log('Transferring ' + currencyID + ' tokens from Listen')
      return api.tx.xTokens.transfer(currencyID, amount, addressSelection, fees)
    case 'Litmus':
      console.log('Transferring tokens from Litmus')
      return api.tx.xTokens.transfer('SelfReserve', amount, addressSelection, fees) // Multiple asset options needs addressing
    case 'Mangata':
      console.log('Transferring ' + currencyID + ' tokens from Mangata')
      return api.tx.xTokens.transfer(currencyID, amount, addressSelection, fees)
    case 'Moonriver':
      console.log('Transferring tokens from Moonriver')
      return api.tx.xTokens.transfer('SelfReserve', amount, addressSelection, fees) // Multiple asset options needs addressing
    case 'ParallelHeiko':
      console.log('Transferring ' + currencyID + ' tokens from Parallel Heiko')
      return api.tx.xTokens.transfer(currencyID, amount, addressSelection, fees)
    case 'Picasso':
      console.log('Transferring ' + currencyID + ' tokens from Picasso')
      return api.tx.xTokens.transfer(currencyID, amount, addressSelection, fees)
    case 'Pichiu':
      console.log('Transferring ' + currency + ' tokens from Pichiu')
      return api.tx.ormlXTokens.transfer(currency, amount, addressSelection, fees)
    case 'Turing':
      console.log('Transferring ' + currencyID + ' tokens from Turing')
      return api.tx.xTokens.transfer(currencyID, amount, addressSelection, fees)
  }
}

export function constructPolkadotXCM(api: ApiPromise, origin: TNode, header: any, addressSelection: any, currencySelection: any, scenario: string): Extrinsic {
  switch (origin) {
    // Polkadot polkadotXCM
    case 'Statemint':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Statemint')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring DOT tokens from Statemint')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Astar':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Astar')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring DOT tokens from Astar')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'ComposableFinance':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from ComposableFinance')
        return api.tx.relayerXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring DOT tokens from ComposableFinance')
        return api.tx.relayerXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Darwinia':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Darwinia')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring DOT tokens from Darwinia')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Efinity':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Efinity')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring DOT tokens from Efinity')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Equilibrium':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Equilibrium')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring DOT tokens from Equilibrium')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Kapex':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Kapex')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring DOT tokens from Kapex')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Kilt':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Kilt')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring DOT tokens from Kilt')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'OriginTrail':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from OriginTrail')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring DOT tokens from OriginTrail')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Phala':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Phala')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring DOT tokens from Phala')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Unique':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Unique')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring DOT tokens from Unique')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break

    // Kusama polkadotXCM
    case 'Statemine':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Statemine')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from Statemine')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Encointer':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Encointer')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from Encointer')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Bajun':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Bajun')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from Bajun')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Crab':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Crab')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from Crab')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'GM':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from GM')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from GM')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Kabocha':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Kabocha')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from Kabocha')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Khala':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Khala')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from Khala')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Quartz':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Quartz')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from Quartz')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Robonomics':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Robonomics')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from Robonomics')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Shiden':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Shiden')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from Shiden')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Snow':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Snow')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from Snow')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Sora':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Sora')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from Sora')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'SubsocialX':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from SubsocialX')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from SubsocialX')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'DataHighway':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from DataHighway')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from DataHighway')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Zeitgeist':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Zeitgeist')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from Zeitgeist')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
  }
}

export function getNodeDetails(node: TNode) {
  return nodes[node]
}

export function getNodeEndpointOption(node: TNode) {
  const { type, name } = getNodeDetails(node)
  const { linked } = type === 'polkadot' ? prodRelayPolkadot : prodRelayKusama
  return linked?.find(o => o.info === name)
}

export function getNodeParaId(node: TNode) {
  const option = getNodeEndpointOption(node)
  return option?.paraId ?? null
}

export async function createApiInstance(wsUrl: string) {
  const wsProvider = new WsProvider(wsUrl)
  return await ApiPromise.create({ provider: wsProvider })
}
