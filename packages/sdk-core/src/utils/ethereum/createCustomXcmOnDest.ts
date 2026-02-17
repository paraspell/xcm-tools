import type { TAssetInfo } from '@paraspell/assets'
import { getNativeAssetSymbol, isChainEvm } from '@paraspell/assets'
import type { TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import { deepEqual, getJunctionValue, Parents, RELAYCHAINS } from '@paraspell/sdk-common'

import { MissingParameterError, UnsupportedOperationError } from '../../errors'
import type { TAddress, TCreateEthBridgeInstructionsOptions } from '../../types'
import { type TPolkadotXCMTransferOptions } from '../../types'
import { assertHasId, assertSenderAddress } from '../assertions'
import { createBeneficiaryLocation } from '../location'
import { getEthereumJunction } from '../location/getEthereumJunction'

const createMainInstruction = (
  origin: TSubstrateChain,
  asset: TAssetInfo,
  ethAsset: TAssetInfo,
  address: TAddress,
  messageId: string
) => {
  assertHasId(ethAsset)

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

  const ethJunction = getEthereumJunction(origin)

  if (isAssetNativeToPolkadot) {
    const assetEcosystem = RELAYCHAINS.find(chain =>
      asset.symbol.includes(getNativeAssetSymbol(chain))
    )

    if (!assetEcosystem) throw new UnsupportedOperationError('Unsupported native polkadot asset')

    return {
      DepositReserveAsset: {
        assets: {
          Wild: {
            AllOf: { id: asset.location, fun: 'Fungible' }
          }
        },
        dest: {
          parents: Parents.TWO,
          interior: { X1: [ethJunction] }
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
        interior: { X1: [ethJunction] }
      },
      xcm: commonXcm({
        parents: Parents.ZERO,
        interior: interiorSb
      })
    }
  }
}

export const createEthereumBridgeInstructions = <TApi, TRes, TSigner>(
  {
    api,
    address,
    assetInfo,
    senderAddress,
    ahAddress,
    version
  }: TCreateEthBridgeInstructionsOptions<TApi, TRes, TSigner>,
  origin: TSubstrateChain,
  messageId: string,
  ethAsset: TAssetInfo
): unknown[] => {
  assertSenderAddress(senderAddress)

  if (isChainEvm(origin) && !ahAddress) {
    throw new MissingParameterError('ahAddress')
  }

  return [
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

export const createCustomXcmOnDest = <TApi, TRes, TSigner>(
  options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>,
  origin: TSubstrateChain,
  messageId: string,
  ethAsset: TAssetInfo
) => {
  const { api, address, assetInfo, senderAddress, ahAddress, version } = options

  const instructions = createEthereumBridgeInstructions(
    { api, address, assetInfo, senderAddress: senderAddress!, ahAddress, version },
    origin,
    messageId,
    ethAsset
  )

  return {
    [version]: instructions
  }
}
