import type { ApiPromise } from '@polkadot/api'

export function transferParaToRelay(api: ApiPromise, origin: string, currency: string, amount: any, to: string) {
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
                  id: api
                    .createType('AccountId32', to)
                    .toHex()
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
                  id: api
                    .createType("AccountId32", to)
                    .toHex()
                }
              }
            }
          }
        },
        4600000000
      )
  }
}

export function transferRelayToPara(api: ApiPromise, destination: string, amount: any, to: string) {
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
                id: api
                  .createType("AccountId32", to)
                  .toHex()
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

export function transferParaToPara(api: ApiPromise, origin: string, destination: string, currency: string, amount: any, to: string) {
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
                    id: api
                      .createType("AccountId32", to)
                      .toHex()
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
                    id: api
                      .createType("AccountId32", to)
                      .toHex()
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
