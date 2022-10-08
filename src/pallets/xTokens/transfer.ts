import type { ApiPromise } from '@polkadot/api'
import { Extrinsic } from '../../types'
import { buildCall, selectLimit, getFees, selectPallet } from '../../utils'

/* eslint-disable */
export function transferParaToRelay(api: ApiPromise, origin: string, currency: string, currencyID: number, amount: any, to: string): Extrinsic {
  return selectPallet(api, origin, currencyID, currency, amount, buildCall("ParaToRelay", api, to, 0), getFees("ParaToRelay"))
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
      buildCall("RelayToPara",api,to,destination),
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
      getFees("RelayToPara")
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
    buildCall("RelayToPara",api,to,destination),
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
    getFees("RelayToPara"),
    selectLimit(limit, isLimited)
  )
}

export function transferParaToPara(api: ApiPromise, origin: string, destination: number, currency: string, currencyID: number,  amount: any, to: string): Extrinsic {
  return selectPallet(api, origin, currencyID, currency, amount, buildCall("ParaToPara", api, to, destination), getFees("ParaToPara"))

}
