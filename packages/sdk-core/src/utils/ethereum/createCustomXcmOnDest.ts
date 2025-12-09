import type { TAssetInfo } from '@paraspell/assets'
import { getNativeAssetSymbol, isChainEvm } from '@paraspell/assets'
import type { TChain, TLocation } from '@paraspell/sdk-common'
import { deepEqual, getJunctionValue, Parents, RELAYCHAINS } from '@paraspell/sdk-common'

import { ETHEREUM_JUNCTION } from '../../constants'
import { InvalidParameterError } from '../../errors'
import type { TAddress } from '../../types'
import { type TPolkadotXCMTransferOptions } from '../../types'
import { assertHasId, assertHasLocation, assertSenderAddress } from '../assertions'
import { createBeneficiaryLocation } from '../location'

const createMainInstruction = (
  origin: TChain,
  asset: TAssetInfo,
  ethAsset: TAssetInfo,
  address: TAddress,
  messageId: string
) => {
  assertHasId(ethAsset)
  assertHasLocation(asset)

  const interiorSb: TLocation['interior'] =
    ethAsset.symbol === 'ETH'
      ? { Here: null }
      : { X1: [{ AccountKey20: { network: null, key: ethAsset.assetId } }] }

  const isAssetNativeToPolkadot =
    !deepEqual(getJunctionValue(asset.location, 'GlobalConsensus'), {
      Ethereum: {
        chainId: 1
      }
      // MYTH needs to use InitiateReserveWithdraw
    }) && origin !== 'Mythos'

  const beneficiary = {
    parents: Parents.ZERO,
    interior: {
      X1: [
        {
          AccountKey20: {
            network: null,
            key: address
          }
        }
      ]
    }
  }

  const makeBuyExecution = (feesId: TLocation) => ({
    BuyExecution: {
      fees: {
        id: feesId,
        fun: { Fungible: 1n }
      },
      weight_limit: 'Unlimited'
    }
  })

  const makeDepositAsset = () => ({
    DepositAsset: {
      assets: { Wild: { AllCounted: 1 } },
      beneficiary
    }
  })

  const commonXcm = (feesId: TLocation) => [
    makeBuyExecution(feesId),
    makeDepositAsset(),
    {
      SetTopic: messageId
    }
  ]

  if (isAssetNativeToPolkadot) {
    const assetEcosystem = RELAYCHAINS.find(chain =>
      asset.symbol.includes(getNativeAssetSymbol(chain))
    )

    if (!assetEcosystem) throw new InvalidParameterError('Unsupported native polkadot asset')

    return {
      DepositReserveAsset: {
        assets: {
          Wild: {
            AllOf: { id: asset.location, fun: 'Fungible' }
          }
        },
        dest: {
          parents: Parents.TWO,
          interior: { X1: [ETHEREUM_JUNCTION] }
        },
        xcm: commonXcm({
          parents: Parents.ONE,
          interior: {
            X1: [{ GlobalConsensus: { [assetEcosystem.toLowerCase()]: null } }]
          }
        })
      }
    }
  }

  return {
    InitiateReserveWithdraw: {
      assets: {
        Wild: {
          AllOf: { id: ethAsset.location, fun: 'Fungible' }
        }
      },
      reserve: {
        parents: Parents.TWO,
        interior: { X1: [ETHEREUM_JUNCTION] }
      },
      xcm: commonXcm({
        parents: Parents.ZERO,
        interior: interiorSb
      })
    }
  }
}

export const createCustomXcmOnDest = <TApi, TRes>(
  {
    api,
    address,
    assetInfo,
    senderAddress,
    ahAddress,
    version
  }: TPolkadotXCMTransferOptions<TApi, TRes>,
  origin: TChain,
  messageId: string,
  ethAsset: TAssetInfo
) => {
  assertSenderAddress(senderAddress)

  if (isChainEvm(origin) && !ahAddress) {
    throw new InvalidParameterError(`Please provide ahAddress`)
  }

  return {
    [version]: [
      {
        SetAppendix:
          origin === 'Mythos'
            ? []
            : [
                {
                  DepositAsset: {
                    assets: { Wild: 'All' },
                    beneficiary: createBeneficiaryLocation({
                      api,
                      address: isChainEvm(origin) ? (ahAddress as string) : senderAddress,
                      version
                    })
                  }
                }
              ]
      },
      createMainInstruction(origin, assetInfo, ethAsset, address, messageId),
      {
        SetTopic: messageId
      }
    ]
  }
}
