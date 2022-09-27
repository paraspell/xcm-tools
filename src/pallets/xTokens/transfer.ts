import type { ApiPromise } from '@polkadot/api'
import { Extrinsic } from '../../types'
import { createAccID, selectLimit } from '../../utils'
/* eslint-disable */
export function transferParaToRelay(api: ApiPromise, origin: string, currency: string, amount: any, to: string): Extrinsic {
  if(origin == "Karura" || origin == "Bifrost" ){
    return api.tx.xTokens
      .transfer(
        {
          Token: currency
        },
        amount,
        {
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
        },
        4600000000
      )
  }
  else if (origin == "Pichiu"){
    return api.tx.ormlXTokens
      .transfer(
        currency,
        amount,
        {
          V1: {
            parents: 1,
            interior: {
              X1: {
                AccountId32: {
                  network: "any",
                  id: createAccID(api, to)
                }
              }
            }
          }
        },
        4600000000
      )
  }
}


export function transferRelayToPara(api: ApiPromise, destination: number, amount: any, to: string): Extrinsic {
  return api.tx.xcmPallet
    .reserveTransferAssets(
      {
        V1: {
          parents: 0,
          interior: {
            X1: {
              Parachain: destination
            }
          }
        }
      },
      {
        V1: {
          parents: 0,
          interior: {
            X1: {
              AccountId32: {
                network: "Any",
                id: createAccID(api, to)
              }
            }
          }
        }
      },
      {
        V1: [
          {
            id: {
              Concrete: {
                parents: 0,
                interior: "Here"
              }
            },
            fun: {
              Fungible: amount
            }
          }
        ]
      },
      0
    )
}

export function limitedTransferRelayToPara(api: ApiPromise, destination: number, amount: any, to: string, limit: number , isLimited: boolean): Extrinsic {
  return api.tx.xcmPallet.limitedReserveTransferAssets(
    {
      V1: {
        parents: 0,
        interior: {
          X1: {
            Parachain: destination
          }
        }
      }
    },
    {
      V1: {
        parents: 0,
        interior: {
          X1: {
            AccountId32: {
              network: "Any",
              id: createAccID(api, to)
            }
          }
        }
      }
    },
    {
      V1: [
        {
          id: {
            Concrete: {
              parents: 0,
              interior: "Here"
            }
          },
          fun: {
            Fungible: amount
          }
        }
      ]
    },
    0,
    selectLimit(limit, isLimited)
  )
}

export function transferParaToPara(api: ApiPromise, origin: string, destination: number, currency: string, amount: any, to: string): Extrinsic {
  if(origin == "Karura" || origin == "Bifrost" ){
    return api.tx.xTokens
      .transfer(
        {
          Token: currency
        },
        amount,
        {
          V1: {
            parents: 1,
            interior: {
              X2: [
                {
                  Parachain: destination
                },
                {
                  AccountId32: {
                    network: "Any",
                    id: createAccID(api, to)
                  }
                }
              ]
            }
          }
        },
        399600000000
      )
  }
  else if (origin == "Pichiu"){
    return api.tx.ormlXTokens
      .transfer(
        currency,
        amount,
        {
          V1: {
            parents: 1,
            interior: {
              X2: [
                {
                  Parachain: destination
                },
                {
                  AccountId32: {
                    network: "Any",
                    id: createAccID(api, to)
                  }
                }
              ]
            }
          }
        },
        399600000000
      )
    }

}
