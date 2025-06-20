import type { TMultiAsset } from '@paraspell/assets'
import { extractMultiAssetLoc, isAssetEqual } from '@paraspell/assets'
import type { TMultiLocation } from '@paraspell/sdk-common'
import {
  deepEqual,
  getJunctionValue,
  hasJunction,
  isSystemChain,
  Parents,
  type TNodePolkadotKusama,
  type Version
} from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../errors'
import { getParaId } from '../../nodes/config'
import { getTNode } from '../../nodes/getTNode'
import { createDestination } from '../../pallets/xcmPallet/utils'
import { type TPolkadotXCMTransferOptions } from '../../types'
import { determineRelayChain } from '..'
import { addXcmVersionHeader } from '../addXcmVersionHeader'
import { assertHasLocation } from '../assertions'
import { createBeneficiary } from '../createBeneficiary'
import { createMultiAsset } from '../multiAsset'
import { localizeLocation } from '../multiLocation'

export const getReserveParaId = (assetLocation: TMultiLocation) => {
  const hasParaJunction = hasJunction(assetLocation, 'Parachain')
  const hasGlobalConsensusJunction = hasJunction(assetLocation, 'GlobalConsensus')

  if (hasParaJunction) {
    return getJunctionValue<number>(assetLocation, 'Parachain')
  }

  if (hasGlobalConsensusJunction) {
    return getParaId('AssetHubPolkadot')
  }

  if (
    deepEqual(assetLocation, {
      parents: Parents.ONE,
      interior: {
        Here: null
      }
    })
  ) {
    return getParaId('Polkadot')
  }
}

const isOnReserveChain = (
  node: TNodePolkadotKusama,
  reserveParaId: number | undefined
): boolean => {
  if (reserveParaId === undefined) return false

  const currentParaId = getParaId(node)
  return currentParaId === reserveParaId
}

export const getChainLocation = (paraId: number): TMultiLocation => {
  const interior =
    paraId === getParaId('Polkadot')
      ? 'Here'
      : {
          X1: [
            {
              Parachain: paraId
            }
          ]
        }

  return {
    parents: Parents.ONE,
    interior
  }
}

export const createAssetsFilter = (asset: TMultiAsset, feeAsset: TMultiAsset | undefined) =>
  !feeAsset
    ? // For same fee asset, deposit only this one asset
      {
        Wild: {
          AllCounted: 1
        }
      }
    : // For different fee asset, specify which one to deposit by location and amount
      {
        Definite: [asset]
      }

const sortMultiAssets = (assets: TMultiAsset[]) =>
  assets.sort((a, b) => {
    const aLoc = extractMultiAssetLoc(a)
    const bLoc = extractMultiAssetLoc(b)

    // 1. Sort by parents first
    if (aLoc.parents !== bLoc.parents) {
      return Number(aLoc.parents) - Number(bLoc.parents)
    }

    // 2. If parents are equal, use priority function
    const aIsHere = isHere(aLoc)
    const bIsHere = isHere(bLoc)

    const aHasGlobal = hasJunction(aLoc, 'GlobalConsensus')
    const bHasGlobal = hasJunction(bLoc, 'GlobalConsensus')

    const aGeneralIndex = getJunctionValue<number>(aLoc, 'GeneralIndex')
    const bGeneralIndex = getJunctionValue<number>(bLoc, 'GeneralIndex')

    const getPriority = (isHere: boolean, hasGlobal: boolean): number => {
      if (isHere) return 0
      if (hasGlobal) return 2
      return 1
    }

    const aPriority = getPriority(aIsHere, aHasGlobal)
    const bPriority = getPriority(bIsHere, bHasGlobal)

    if (aPriority !== bPriority) return aPriority - bPriority

    if (aGeneralIndex === undefined && bGeneralIndex === undefined) return 0
    if (aGeneralIndex === undefined) return 1
    if (bGeneralIndex === undefined) return -1

    return aGeneralIndex - bGeneralIndex
  })

const isHere = (loc: TMultiLocation): boolean => {
  return loc.interior === 'Here' || loc.interior?.Here !== undefined
}

const updateAsset = (asset: TMultiAsset, amount: bigint): TMultiAsset => {
  return {
    ...asset,
    fun: {
      Fungible: amount
    }
  }
}

const createWithdrawAssets = (asset: TMultiAsset, feeAsset: TMultiAsset | undefined) => {
  const assetsToWithdraw = [asset]

  if (feeAsset) {
    assetsToWithdraw.push(feeAsset)
  }

  return sortMultiAssets(assetsToWithdraw)
}

export const createExecuteXcm = <TApi, TRes>(
  node: TNodePolkadotKusama,
  destChain: TNodePolkadotKusama,
  input: TPolkadotXCMTransferOptions<TApi, TRes>,
  executionFee: bigint,
  hopExecutionFee: bigint,
  version: Version
) => {
  const { api, asset, scenario, destination, paraIdTo, address, feeAsset } = input

  const amount = BigInt(asset.amount)

  const dest = createDestination(scenario, version, destination, paraIdTo)

  const beneficiary = createBeneficiary({
    api,
    scenario,
    pallet: 'PolkadotXcm',
    recipientAddress: address,
    version,
    paraId: paraIdTo
  })

  assertHasLocation(asset)
  if (feeAsset) {
    assertHasLocation(feeAsset)
  }

  const reserveParaId = getReserveParaId(asset.multiLocation)

  const reserveChain =
    reserveParaId !== undefined
      ? getTNode(reserveParaId, determineRelayChain(node) === 'Polkadot' ? 'polkadot' : 'kusama')
      : undefined

  const isReserveDest = reserveParaId === paraIdTo

  const multiAsset = createMultiAsset(version, amount, asset.multiLocation)
  const multiAssetLocalized = createMultiAsset(
    version,
    amount,
    localizeLocation(node, asset.multiLocation)
  )
  const multiAssetLocalizedToReserve = createMultiAsset(
    version,
    amount,
    localizeLocation(reserveChain ?? node, asset.multiLocation)
  )

  const multiAssetLocalizedToDest = createMultiAsset(
    version,
    amount,
    localizeLocation(destChain, asset.multiLocation)
  )

  const feeMultiAsset =
    feeAsset && !isAssetEqual(asset, feeAsset)
      ? createMultiAsset(version, executionFee, feeAsset.multiLocation)
      : undefined

  const feeMultiAssetLocalized =
    feeAsset && !isAssetEqual(asset, feeAsset)
      ? createMultiAsset(version, executionFee, localizeLocation(node, feeAsset.multiLocation))
      : undefined

  const feeMultiAssetLocalizedToReserve =
    feeAsset && !isAssetEqual(asset, feeAsset)
      ? createMultiAsset(
          version,
          executionFee,
          localizeLocation(reserveChain ?? node, feeAsset.multiLocation)
        )
      : undefined

  const withdrawAssets = createWithdrawAssets(
    node === 'AssetHubPolkadot' ? multiAssetLocalized : multiAsset,
    node === 'AssetHubPolkadot' ? feeMultiAssetLocalized : feeMultiAsset
  )

  const assetsFilter = createAssetsFilter(multiAsset, feeMultiAsset)

  if (node !== 'AssetHubPolkadot' && reserveParaId === undefined) {
    throw new InvalidParameterError(
      'Sending local reserve assets with custom fee asset is not yet supported for this chain.'
    )
  }

  const chainsAreTrusted = isSystemChain(node) && isSystemChain(destChain)

  const depositInstruction =
    isReserveDest || chainsAreTrusted
      ? {
          DepositAsset: {
            assets: createAssetsFilter(
              multiAssetLocalizedToReserve,
              feeMultiAssetLocalizedToReserve
            ),
            beneficiary
          }
        }
      : {
          DepositReserveAsset: {
            assets: createAssetsFilter(multiAssetLocalized, feeMultiAssetLocalized),
            dest,
            xcm: [
              {
                BuyExecution: {
                  fees: updateAsset(
                    multiAsset,
                    amount - (feeMultiAsset ? hopExecutionFee : executionFee + hopExecutionFee)
                  ),
                  weight_limit: 'Unlimited'
                }
              },
              {
                DepositAsset: {
                  assets: {
                    Wild: {
                      AllCounted: 1
                    }
                  },
                  beneficiary
                }
              }
            ]
          }
        }

  const needsIntermediaryReserve =
    reserveParaId !== undefined && // Has a reserve
    !isOnReserveChain(node, reserveParaId) // Not on reserve

  const lastInstruction = chainsAreTrusted
    ? // Use teleport for trusted chains
      {
        InitiateTeleport: {
          assets: assetsFilter,
          dest,
          xcm: [
            {
              BuyExecution: {
                fees: updateAsset(
                  multiAssetLocalizedToDest,
                  feeMultiAsset ? amount : amount - executionFee
                ),
                weight_limit: 'Unlimited'
              }
            },
            {
              DepositAsset: {
                assets: {
                  Wild: {
                    AllCounted: 1
                  }
                },
                beneficiary
              }
            }
          ]
        }
      }
    : needsIntermediaryReserve
      ? // Use reserve for non-trusted chains
        {
          InitiateReserveWithdraw: {
            assets: assetsFilter,
            reserve: getChainLocation(reserveParaId),
            xcm: [
              {
                BuyExecution: {
                  fees:
                    // Decrease amount by 2 units becuase for some reason polkadot withdraws 2 units less
                    // than requested, so we need to account for that
                    updateAsset(multiAssetLocalizedToReserve, amount - 2n),
                  weight_limit: 'Unlimited'
                }
              },
              depositInstruction
            ]
          }
        }
      : depositInstruction

  const xcm = [
    {
      WithdrawAsset: withdrawAssets
    },
    {
      BuyExecution: {
        fees:
          (node === 'AssetHubPolkadot' ? feeMultiAssetLocalized : feeMultiAsset) ??
          (node === 'AssetHubPolkadot' ? multiAssetLocalized : multiAsset),
        weight_limit: {
          Limited: {
            ref_time: 450n,
            proof_size: 0n
          }
        }
      }
    },
    lastInstruction
  ]

  return addXcmVersionHeader(xcm, version)
}
