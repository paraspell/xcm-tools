import { Parents } from '@paraspell/sdk-common'

import { DOT_MULTILOCATION } from '../constants'
import { getParaId } from '../nodes/config'
import { addXcmVersionHeader } from '../pallets/xcmPallet/utils'
import type { TCreateXcmIdentityCallOptions } from '../types'
import { Version } from '../types'
import { createX1Payload, determineRelayChain, isRelayChain } from '../utils'

export const createXcmIdentityCall = async <TApi, TRes>({
  api,
  from,
  xcmFee,
  identity,
  regIndex,
  maxRegistrarFee
}: TCreateXcmIdentityCallOptions<TApi, TRes>): Promise<TRes> => {
  const to = determineRelayChain(from) === 'Polkadot' ? 'PeoplePolkadot' : 'PeopleKusama'

  await api.init(from)

  const peopleApi = api.clone()

  await peopleApi.init(to)

  const version = Version.V4

  const { display, legal, web, matrix, email, image, twitter, github, discord } = identity

  const setIdentityCall = peopleApi.callTxMethod({
    module: 'Identity',
    section: 'set_identity',
    parameters: {
      info: {
        display: display
          ? peopleApi.createRaw(display)
          : {
              None: null
            },
        legal: legal
          ? peopleApi.createRaw(legal)
          : {
              None: null
            },
        web: web
          ? peopleApi.createRaw(web)
          : {
              None: null
            },
        matrix: matrix
          ? peopleApi.createRaw(matrix)
          : {
              None: null
            },
        email: email
          ? peopleApi.createRaw(email)
          : {
              None: null
            },
        image: image
          ? peopleApi.createRaw(image)
          : {
              None: null
            },
        twitter: twitter
          ? peopleApi.createRaw(twitter)
          : {
              None: null
            },
        github: github
          ? peopleApi.createRaw(github)
          : {
              None: null
            },
        discord: discord
          ? peopleApi.createRaw(discord)
          : {
              None: null
            }
      }
    }
  })

  const xcmFeeWithFallback = xcmFee ?? 10_000_000_000n

  const requestJudgementCall = peopleApi.callTxMethod({
    module: 'Identity',
    section: 'request_judgement',
    parameters: {
      reg_index: regIndex,
      max_fee: maxRegistrarFee
    }
  })

  return api.callTxMethod({
    module: isRelayChain(from) ? 'XcmPallet' : 'PolkadotXcm',
    section: 'send',
    parameters: {
      dest: addXcmVersionHeader(
        {
          parents: Parents.ONE,
          interior: createX1Payload(version, {
            Parachain: getParaId(to)
          })
        },
        version
      ),
      message: addXcmVersionHeader(
        [
          {
            WithdrawAsset: [
              {
                id: DOT_MULTILOCATION,
                fun: {
                  Fungible: xcmFeeWithFallback
                }
              }
            ]
          },
          {
            BuyExecution: {
              fees: {
                id: DOT_MULTILOCATION,
                fun: {
                  Fungible: xcmFeeWithFallback / 2n
                }
              },
              weight_limit: {
                Limited: {
                  ref_time: 500_000_000n,
                  proof_size: 0n
                }
              }
            }
          },
          {
            Transact: {
              origin_kind: {
                SovereignAccount: null
              },
              require_weight_at_most: {
                ref_time: 200_000_000n,
                proof_size: 0n
              },
              call: await peopleApi.encodeTx(setIdentityCall)
            }
          },
          {
            Transact: {
              origin_kind: {
                SovereignAccount: null
              },
              require_weight_at_most: {
                ref_time: 300_000_000n,
                proof_size: 0n
              },
              call: await peopleApi.encodeTx(requestJudgementCall)
            }
          }
        ],
        version
      )
    }
  })
}
