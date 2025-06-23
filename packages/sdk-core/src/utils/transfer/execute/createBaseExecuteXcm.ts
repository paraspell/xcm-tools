import type { TMultiAsset } from '@paraspell/assets'
import type { TNodeDotKsmWithRelayChains, TNodeWithRelayChains } from '@paraspell/sdk-common'
import { isSystemChain } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../../errors'
import { createDestination } from '../../../pallets/xcmPallet/utils'
import type { TCreateBaseTransferXcmOptions } from '../../../types'
import { getChainLocation } from '../../location/getChainLocation'
import { createAssetsFilter } from './createAssetsFilter'
import { prepareExecuteContext } from './prepareExecuteContext'

const updateAsset = (asset: TMultiAsset, amount: bigint): TMultiAsset => {
  return {
    ...asset,
    fun: {
      Fungible: amount
    }
  }
}

type TTransferType = 'teleport' | 'reserve_transfer' | 'direct_deposit' | 'teleport_to_reserve'

const getTransferType = (
  origin: TNodeDotKsmWithRelayChains,
  destination: TNodeWithRelayChains,
  reserveChain?: TNodeWithRelayChains
): TTransferType => {
  if (
    reserveChain !== undefined &&
    origin !== reserveChain &&
    isSystemChain(origin) &&
    isSystemChain(reserveChain)
  ) {
    return 'teleport_to_reserve'
  }

  // Trusted chains can teleport
  if (isSystemChain(origin) && isSystemChain(destination)) {
    return 'teleport'
  }

  // If we need intermediary reserve (not on reserve chain)
  if (reserveChain !== undefined && origin !== reserveChain) {
    return 'reserve_transfer'
  }

  // Direct deposit (either no reserve or we're on reserve)
  return 'direct_deposit'
}

export const createBaseExecuteXcm = (
  options: TCreateBaseTransferXcmOptions & { suffixXcm?: unknown[] }
) => {
  const {
    chain,
    destChain,
    fees: { originFee, reserveFee },
    version,
    paraIdTo,
    suffixXcm = []
  } = options

  const {
    amount,
    multiAssetLocalized,
    multiAssetLocalizedToReserve,
    multiAssetLocalizedToDest,
    feeMultiAsset,
    reserveChain
  } = prepareExecuteContext(options)

  const destLocation = createDestination(version, chain, destChain, paraIdTo)

  if (chain !== 'AssetHubPolkadot' && reserveChain === undefined) {
    throw new InvalidParameterError(
      'Sending local reserve assets with custom fee asset is not yet supported for this chain.'
    )
  }

  const transferType = getTransferType(chain, destChain, reserveChain)

  const isReserveDest = reserveChain === destChain

  const resolvedDepositInstruction = isReserveDest
    ? suffixXcm
    : [
        {
          DepositReserveAsset: {
            assets: createAssetsFilter(multiAssetLocalizedToReserve),
            dest: createDestination(version, reserveChain ?? chain, destChain, paraIdTo),
            xcm: [
              {
                BuyExecution: {
                  fees: updateAsset(
                    multiAssetLocalizedToDest,
                    amount - (feeMultiAsset ? reserveFee : originFee + reserveFee)
                  ),
                  weight_limit: 'Unlimited'
                }
              },
              ...suffixXcm
            ]
          }
        }
      ]

  let mainInstructions

  switch (transferType) {
    case 'teleport':
      // Use teleport for trusted chains
      mainInstructions = [
        {
          InitiateTeleport: {
            assets: createAssetsFilter(multiAssetLocalized),
            dest: destLocation,
            xcm: [
              {
                BuyExecution: {
                  fees: updateAsset(
                    multiAssetLocalizedToDest,
                    feeMultiAsset ? amount : amount - originFee
                  ),
                  weight_limit: 'Unlimited'
                }
              },
              ...suffixXcm
            ]
          }
        }
      ]
      break

    case 'teleport_to_reserve':
      // Teleport to reserve chain first
      mainInstructions = [
        {
          InitiateTeleport: {
            assets: createAssetsFilter(multiAssetLocalized),
            dest: getChainLocation(reserveChain),
            xcm: [
              {
                BuyExecution: {
                  fees: updateAsset(
                    multiAssetLocalizedToReserve,
                    feeMultiAsset ? amount : amount - originFee
                  ),
                  weight_limit: 'Unlimited'
                }
              },
              // Then deposit to final destination
              ...resolvedDepositInstruction
            ]
          }
        }
      ]
      break

    case 'reserve_transfer':
      // Use InitiateReserve for non-trusted chains
      mainInstructions = [
        {
          InitiateReserveWithdraw: {
            assets: createAssetsFilter(multiAssetLocalized),
            reserve: getChainLocation(reserveChain),
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
              // If the dest is reserve, use just DepositAsset
              // Otherwise, asset needs to be sent to the reserve chain first and then deposited
              ...resolvedDepositInstruction
            ]
          }
        }
      ]
      break

    case 'direct_deposit':
      mainInstructions = resolvedDepositInstruction
  }

  return mainInstructions
}
