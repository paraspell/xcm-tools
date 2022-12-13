import { ApiPromise, WsProvider } from '@polkadot/api'
import { ethers } from 'ethers'
import { prodRelayPolkadot, prodRelayKusama } from '@polkadot/apps-config/endpoints'
import { nodeToPallet } from './maps/PalletMap'
import { Extrinsic, TNode, TScenario } from './types'
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

export function handleAddress(scenario: TScenario, pallet: string, api: ApiPromise, to: string, nodeId?: number, node?: TNode): any {
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

export function createCurrencySpecification(amount: any, scenario: TScenario, node?: TNode, cur?: number) {
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

    // Otherwise
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
    return {
      V1: {
        parents: 1,
        interior: 'Here'
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
    default:
      throw new Error(`Invalid node: ${origin}`)
  }
}

export function constructPolkadotXCM(api: ApiPromise, origin: TNode, header: any, addressSelection: any, currencySelection: any, scenario: TScenario): Extrinsic {
  switch (origin) {
    // Polkadot polkadotXCM
    case 'Statemint':
      if (scenario === 'ParaToPara') {
        console.log('Transferring selected tokens from Statemint') // TESTED https://polkadot.subscan.io/xcm_message/polkadot-e4cdf1c59ffbb3d504adbc893d6b7d72665e484d
        return api.tx.polkadotXcm.limitedReserveTransferAssets(header, addressSelection, currencySelection, 0, 'Unlimited')
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring DOT tokens from Statemint') // TESTED https://polkadot.subscan.io/xcm_message/polkadot-c01158ff1a5c5a596138ed9d0f0f2bccc1d9c51d
        return api.tx.polkadotXcm.limitedTeleportAssets(header, addressSelection, currencySelection, 0, 'Unlimited')
      }
      break
    case 'Astar':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Astar') // TESTED https://polkadot.subscan.io/xcm_message/polkadot-f2b697df74ebe4b62853fe81b8b7d0522464972d
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring DOT tokens from Astar') // TESTED https://polkadot.subscan.io/xcm_message/polkadot-58e4741f4c9f99bbdf65f16c81a233ad60a7ad1d
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Darwinia':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Darwinia') // TESTED https://polkadot.subscan.io/xcm_message/polkadot-55c5c36c8fe8794c8cfbea725c9f8bc5984c6b05
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } // else if (scenario === 'ParaToRelay') {
      // console.log('Transferring DOT tokens from Darwinia') //DOT NOT REGISTERED ON DARWINIA CHAIN YET.
      // return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      // }
      break

      // NODES INCOMPATIBLE WITH XCM IN ANY FORM FOR NOW.
      // case 'Efinity':
      //  if (scenario === 'ParaToPara') {
      //    console.log('Transferring native tokens from Efinity')
      //    return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      //  } else if (scenario === 'ParaToRelay') {
      //    console.log('Transferring DOT tokens from Efinity')
      //    return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      //  }
      //  break
      // case 'Equilibrium':
      //  if (scenario === 'ParaToPara') {
      //   console.log('Transferring native tokens from Equilibrium')
      //   return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      //  } else if (scenario === 'ParaToRelay') {
      //    console.log('Transferring DOT tokens from Equilibrium')
      //    return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      //  }
      //  break
      // case 'Kapex':
      // if (scenario === 'ParaToPara') {
      //    console.log('Transferring native tokens from Kapex')
      //    return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      //  } else if (scenario === 'ParaToRelay') {
      //    console.log('Transferring DOT tokens from Kapex')
      //    return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      //  }
      //  break
      // case 'Kilt':
      //  if (scenario === 'ParaToPara') {
      //    console.log('Transferring native tokens from Kilt')
      //    return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      //  } else if (scenario === 'ParaToRelay') {
      //    console.log('Transferring DOT tokens from Kilt')
      //    return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      //  }
      //  break
      // case 'OriginTrail':
      //  if (scenario === 'ParaToPara') {
      //    console.log('Transferring native tokens from OriginTrail')
      //    return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      //  } else if (scenario === 'ParaToRelay') {
      //    console.log('Transferring DOT tokens from OriginTrail')
      //    return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      //  }
      //  break
      // case 'Phala':
      //  if (scenario === 'ParaToPara') {
      //    console.log('Transferring native tokens from Phala')
      //    return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      //  } else if (scenario === 'ParaToRelay') {
      //    console.log('Transferring DOT tokens from Phala')
      //    return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      //  }
      //  break
      // case 'Unique':
      //  if (scenario === 'ParaToPara') {
      //    console.log('Transferring native tokens from Unique')
      //    return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      //  } else if (scenario === 'ParaToRelay') {
      //    console.log('Transferring DOT tokens from Unique')
      //    return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      //  }
      //  break

    // Kusama polkadotXCM
    case 'Statemine':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Statemine') // TESTED https://kusama.subscan.io/xcm_message/kusama-ddc2a48f0d8e0337832d7aae26f6c3053e1f4ffd
        return api.tx.polkadotXcm.limitedReserveTransferAssets(header, addressSelection, currencySelection, 0, 'Unlimited')
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from Statemine') // TESTED https://kusama.subscan.io/xcm_message/kusama-8e423130a4d8b61679af95dbea18a55124f99672
        return api.tx.polkadotXcm.limitedTeleportAssets(header, addressSelection, currencySelection, 0, 'Unlimited')
      }
      break
    case 'Encointer':
      // NO PARA TO PARA SCENARIOS ON SUBSCAN
      // if (scenario === 'ParaToPara') {
      //  console.log('Transferring native tokens from Encointer')
      //  return api.tx.polkadotXcm.limitedReserveTransferAssets(header, addressSelection, currencySelection, 0, 'Unlimited')
      // }
      if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from Encointer') // TESTED https://encointer.subscan.io/xcm_message/kusama-418501e86e947b16c4e4e9040694017e64f9b162
        return api.tx.polkadotXcm.limitedTeleportAssets(header, addressSelection, currencySelection, 0, 'Unlimited')
      }
      break
    // case 'Bajun':
    //  if (scenario === 'ParaToPara') {
    //    console.log('Transferring native tokens from Bajun')
    //    return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
    //  } else if (scenario === 'ParaToRelay') {
    //    console.log('Transferring KSM tokens from Bajun')
    //    return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
    //  }
    //  break
    case 'Crab':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Crab') // TESTED https://kusama.subscan.io/xcm_message/kusama-ce7396ec470ba0c6516a50075046ee65464572dc
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } // else if (scenario === 'ParaToRelay') {  //KSM NOT COMPATIBLE
      //  console.log('Transferring KSM tokens from Crab')
      //   return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      // }
      break
    // case 'GM':
    //  if (scenario === 'ParaToPara') {
    //    console.log('Transferring native tokens from GM')
    //    return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
    //  } else if (scenario === 'ParaToRelay') {
    //    console.log('Transferring KSM tokens from GM')
    //    return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
    //  }
    //  break
    // case 'Kabocha':
    //  if (scenario === 'ParaToPara') {
    //    console.log('Transferring native tokens from Kabocha')
    //    return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
    //  } else if (scenario === 'ParaToRelay') {
    //    console.log('Transferring KSM tokens from Kabocha')
    //    return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
    //  }
    //  break
    // case 'Khala':
      // if (scenario === 'ParaToPara') { //UNSUPPORTED DUE TO FACT ALL TRANSFERS COME TO KHALA BUT KHALA DOES NOT HAVE ANY TRANSFERS LEAVING
      //  console.log('Transferring native tokens from Khala')
      //  return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      // }// else if (scenario === 'ParaToRelay') { //UNSUPPORTED DUE TO NEW VERSION OF POLKADOTXCM PALLET
      //  console.log('Transferring KSM tokens from Khala')
      //  return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      // }
    //  break
    case 'Quartz':
      if (scenario === 'ParaToPara') { // TESTED https://quartz.subscan.io/xcm_message/kusama-f5b6580f8d7f97a8d33209d2b5b34d97454587e9
        console.log('Transferring native tokens from Quartz')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      }// else if (scenario === 'ParaToRelay') { //KSM ASSET NOT REGISTERED {ASSET NOT FOUND ERROR}
      //  console.log('Transferring KSM tokens from Quartz')
      //  return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      // }
      break
    case 'Robonomics':
      if (scenario === 'ParaToPara') { // TESTED https://robonomics.subscan.io/xcm_message/kusama-e9641113dae59920e5cc0e012f1510ea0e2d0455
        console.log('Transferring native tokens from Robonomics')
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') { // TESTED https://robonomics.subscan.io/xcm_message/kusama-20b03208c99f2ef29d2d4b4cd4bc5659e54311ea
        console.log('Transferring KSM tokens from Robonomics')
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    case 'Shiden':
      if (scenario === 'ParaToPara') {
        console.log('Transferring native tokens from Shiden') // Same as Astar, works.
        return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
      } else if (scenario === 'ParaToRelay') {
        console.log('Transferring KSM tokens from Shiden') // https://shiden.subscan.io/xcm_message/kusama-97eb47c25c781affa557f36dbd117d49f7e1ab4e
        return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
      }
      break
    // case 'Snow':
    //  if (scenario === 'ParaToPara') {
    //    console.log('Transferring native tokens from Snow')
    //    return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
    //  } else if (scenario === 'ParaToRelay') {
    //    console.log('Transferring KSM tokens from Snow')
    //    return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
    //  }
    // break
    // case 'Sora':
    //  if (scenario === 'ParaToPara') {
    //    console.log('Transferring native tokens from Sora')
    //    return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
    //  } else if (scenario === 'ParaToRelay') {
    //    console.log('Transferring KSM tokens from Sora')
    //    return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
    //  }
    //  break
    // case 'SubsocialX':
    //  if (scenario === 'ParaToPara') {
    //    console.log('Transferring native tokens from SubsocialX')
    //    return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
    //  } else if (scenario === 'ParaToRelay') {
    //    console.log('Transferring KSM tokens from SubsocialX')
    //    return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
    //  }
    //  break
    // case 'DataHighway':
    //  if (scenario === 'ParaToPara') {
    //    console.log('Transferring native tokens from DataHighway')
    //    return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
    //  } else if (scenario === 'ParaToRelay') {
    //    console.log('Transferring KSM tokens from DataHighway')
    //    return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
    //  }
    //  break
    // case 'Zeitgeist':
    //  if (scenario === 'ParaToPara') {
    //    console.log('Transferring native tokens from Zeitgeist')
    //    return api.tx.polkadotXcm.reserveTransferAssets(header, addressSelection, currencySelection, 0)
    //  } else if (scenario === 'ParaToRelay') {
    //    console.log('Transferring KSM tokens from Zeitgeist')
    //    return api.tx.polkadotXcm.reserveWithdrawAssets(header, addressSelection, currencySelection, 0)
    //  }
  }
  throw new Error(`Invalid node/ Node does not support XCM at the moment: ${origin}`)
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
