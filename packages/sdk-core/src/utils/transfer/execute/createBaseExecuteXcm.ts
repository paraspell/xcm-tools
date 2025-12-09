import { type TAsset } from '@paraspell/assets'
import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'
import { isTrustedChain } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../../errors'
import { createDestination } from '../../../pallets/xcmPallet/utils'
import type { TCreateBaseTransferXcmOptions } from '../../../types'
import { getChainLocation } from '../../location/getChainLocation'
import { createAssetsFilter } from './createAssetsFilter'
import { prepareExecuteContext } from './prepareExecuteContext'

const updateAsset = (asset: TAsset, amount: bigint): TAsset => {
  return {
    ...asset,
    fun: {
      Fungible: amount
    }
  }
}

type TTransferType = 'teleport' | 'reserve_transfer' | 'direct_deposit' | 'teleport_to_reserve'

const getTransferType = (
  origin: TSubstrateChain,
  destination: TChain,
  reserveChain?: TSubstrateChain
): TTransferType => {
  if (
    reserveChain !== undefined &&
    origin !== reserveChain &&
    isTrustedChain(origin) &&
    isTrustedChain(reserveChain)
  ) {
    return 'teleport_to_reserve'
  }

  // Trusted chains can teleport
  if (isTrustedChain(origin) && isTrustedChain(destination)) {
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
    assetLocalized,
    assetLocalizedToReserve,
    assetLocalizedToDest,
    feeAsset,
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
            assets: createAssetsFilter(assetLocalizedToReserve, version),
            dest: createDestination(version, reserveChain ?? chain, destChain, paraIdTo),
            xcm: [
              {
                BuyExecution: {
                  fees: updateAsset(
                    assetLocalizedToDest,
                    reserveFee === 1000n
                      ? amount / 2n
                      : amount - (feeAsset ? reserveFee : originFee + reserveFee)
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
            assets: createAssetsFilter(assetLocalized, version),
            dest: destLocation,
            xcm: [
              {
                BuyExecution: {
                  fees: updateAsset(assetLocalizedToDest, feeAsset ? amount : amount - originFee),
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
            assets: createAssetsFilter(assetLocalized, version),
            dest: getChainLocation(chain, reserveChain),
            xcm: [
              {
                BuyExecution: {
                  fees: updateAsset(
                    assetLocalizedToReserve,
                    feeAsset ? amount : amount - originFee
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
            assets: createAssetsFilter(assetLocalized, version),
            reserve: getChainLocation(chain, reserveChain),
            xcm: [
              {
                BuyExecution: {
                  fees:
                    // Decrease amount by 2 units becuase for some reason polkadot withdraws 2 units less
                    // than requested, so we need to account for that
                    updateAsset(assetLocalizedToReserve, amount - 2n),
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
