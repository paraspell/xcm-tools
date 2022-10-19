import type { ApiPromise } from '@polkadot/api'
import { ethers } from 'ethers'

import { Extrinsic } from './types'

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
  } else {
    console.log('Asigning fees for transfer from Relay chain')
    return 0
  }
}

export function buildCall(scenario: string, api: ApiPromise, to: string, nodeId: number): any {
  if (scenario === 'ParaToRelay') {
    if (ethers.utils.isAddress(to)) {
      console.log('AccountKey20 transfer')
      return {
        V1: {
          parents: 1,
          interior: {
            X1: {
              AccountKey20: {
                network: 'any',
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
  } else if (scenario === 'ParaToPara') {
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

export function selectPallet(api: ApiPromise, origin: string, currencyID: number, currency: string, amount: number, call: any, fees: number): Extrinsic {
  switch (origin) {
    // Polkadot
    case 'Acala':
      console.log('Transferring tokens ' + currency + ' from Acala')
      return api.tx.xTokens.transfer({ Token: currency }, amount, call, fees) // Multiple asset options need addressing
    case 'Bifrost_Polkadot':
      console.log('Transferring ' + currency + ' tokens from Bifrost - Polkadot')
      return api.tx.xTokens.transfer({ Token: currency }, amount, call, fees) // Multiple asset options need addressing
    case 'Centrifuge':
      console.log('Transferring tokens from Centrifuge')
      return api.tx.xTokens.transfer('Native', amount, call, fees) // Multiple asset options needs addressing
    case 'Clover':
      console.log('Transferring tokens from Clover')
      return api.tx.xTokens.transfer('SelfReserve', amount, call, fees) // Multiple asset options needs addressing
    case 'HydraDX':
      console.log('Transferring ' + currencyID + 'tokens from HydraDX')
      return api.tx.xTokens.transfer(currencyID, amount, call, fees)
    case 'Interlay':
      console.log('Transferring ' + currency + 'tokens from Interlay')
      return api.tx.xTokens.transfer({ Token: currency }, amount, call, fees) // Multiple asset options needs addressing
    case 'Moonbeam':
      console.log('Transferring tokens from Moonbeam')
      return api.tx.xTokens.transfer('SelfReserve', amount, call, fees) // Multiple asset options needs addressing
    case 'Parallel':
      console.log('Transferring ' + currencyID + ' tokens from Parallel')
      return api.tx.xTokens.transfer(currencyID, amount, call, fees)

      // Kusama
    case 'Altair':
      console.log('Transferring tokens from Altair')
      return api.tx.xTokens.transfer('Native', amount, call, fees) // Multiple asset options needs addressing
    case 'Basilisk':
      console.log('Transferring ' + currencyID + ' tokens from Basilisk')
      return api.tx.xTokens.transfer(currencyID, amount, call, fees)
    case 'Bifrost_Kusama':
      console.log('Transferring ' + currency + ' tokens from Bifrost - Kusama')
      return api.tx.xTokens.transfer({ Token: currency }, amount, call, fees) // Multiple asset options need addressing
    case 'Pioneer':
      console.log('Transferring tokens from Pioneer')
      return api.tx.xTokens.transfer('NativeToken', amount, call, fees) // Multiple asset options needs addressing
    case 'Calamari':
      console.log('Transferring ' + currencyID + ' tokens from Calamari')
      return api.tx.xTokens.transfer({ MantaCurrency: currencyID }, amount, call, fees) // Currently only option for XCM transfer
    case 'Crust_Shadow':
      console.log('Transferring tokens from Crust Shadow')
      return api.tx.xTokens.transfer('SelfReserve', amount, call, fees) // Multiple asset options needs addressing
    case 'Dorafactory':
      console.log('Transferring ' + currency + ' tokens from DoraFactory')
      return api.tx.xTokens.transfer(currency, amount, call, fees)
    case 'imbue':
      console.log('Transferring ' + currency + ' tokens from imbue')
      return api.tx.xTokens.transfer(currency, amount, call, fees)
    case 'Integritee':
      console.log('Transferring ' + currency + ' tokens from Integritee')
      return api.tx.xTokens.transfer(currency, amount, call, fees)
    case 'InvArch_Tinker':
      console.log('Transferring ' + currencyID + ' tokens from InvArch Tinker')
      return api.tx.xTokens.transfer(currencyID, amount, call, fees)
    case 'Karura':
      console.log('Transferring ' + currency + ' tokens from Karura')
      return api.tx.xTokens.transfer({ Token: currency }, amount, call, fees) // Multiple asset options need addressing
    case 'KICO':
      console.log('Transferring ' + currencyID + ' tokens from KICO')
      return api.tx.xTokens.transfer(currencyID, amount, call, fees)
    case 'kintsugi':
      console.log('Transferring ' + currency + ' tokens from kintsugi')
      return api.tx.xTokens.transfer({ Token: currency }, amount, call, fees) // Multiple asset options need addressing
    case 'Listen':
      console.log('Transferring ' + currencyID + ' tokens from Listen')
      return api.tx.xTokens.transfer(currencyID, amount, call, fees)
    case 'Litmus':
      console.log('Transferring tokens from Litmus')
      return api.tx.xTokens.transfer('SelfReserve', amount, call, fees) // Multiple asset options needs addressing
    case 'Mangata':
      console.log('Transferring ' + currencyID + ' tokens from Mangata')
      return api.tx.xTokens.transfer(currencyID, amount, call, fees)
    case 'Moonriver':
      console.log('Transferring tokens from Moonriver')
      return api.tx.xTokens.transfer('SelfReserve', amount, call, fees) // Multiple asset options needs addressing
    case 'Parallel_Heiko':
      console.log('Transferring ' + currencyID + ' tokens from Parallel Heiko')
      return api.tx.xTokens.transfer(currencyID, amount, call, fees)
    case 'Picasso':
      console.log('Transferring ' + currencyID + ' tokens from Picasso')
      return api.tx.xTokens.transfer(currencyID, amount, call, fees)
    case 'Pichiu':
      console.log('Transferring ' + currency + ' tokens from Pichiu')
      return api.tx.ormlXTokens.transfer(currency, amount, call, fees)
    case 'Turing':
      console.log('Transferring ' + currencyID + ' tokens from Turing')
      return api.tx.xTokens.transfer(currencyID, amount, call, fees)
  }
}
