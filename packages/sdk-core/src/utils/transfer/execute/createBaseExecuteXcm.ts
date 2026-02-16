import { type TAsset } from '@paraspell/assets'
import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'
import { isTrustedChain } from '@paraspell/sdk-common'

import { UnsupportedOperationError } from '../../../errors'
import { createPayFees } from '../../../pallets/polkadotXcm'
import type { TCreateBaseTransferXcmOptions, TTransactOptions } from '../../../types'
import { createDestination, getChainLocation } from '../../location'
import { createAssetsFilter } from './createAssetsFilter'
import { prepareExecuteContext } from './prepareExecuteContext'

const updateAsset = (asset: TAsset, amount: bigint): TAsset => ({
  ...asset,
  fun: {
    Fungible: amount
  }
})

const getInstructionType = <TRes>(
  version: Version,
  origin: TSubstrateChain,
  destination: TChain,
  reserveChain?: TSubstrateChain,
  transactOptions?: TTransactOptions<TRes>
) => {
  if (version >= Version.V5 && transactOptions?.call) {
    return 'InitiateTransfer'
  }

  if (
    reserveChain !== undefined &&
    origin !== reserveChain &&
    isTrustedChain(origin) &&
    isTrustedChain(reserveChain)
  ) {
    return 'InitiateTeleportToReserve'
  }

  // Trusted chains can teleport
  if (isTrustedChain(origin) && isTrustedChain(destination)) {
    return 'InitiateTeleport'
  }

  // If we need intermediary reserve (not on reserve chain)
  if (reserveChain !== undefined && origin !== reserveChain) {
    return 'InitiateReserveWithdraw'
  }

  // Direct deposit (either no reserve or we're on reserve)
  return 'DepositAsset'
}

const getInitiateTransferType = (
  origin: TSubstrateChain,
  destination: TChain,
  reserveChain?: TSubstrateChain
) => {
  if (isTrustedChain(origin) && isTrustedChain(destination)) {
    return 'Teleport'
  }

  if (origin === reserveChain) return 'ReserveDeposit'

  return 'ReserveWithdraw'
}

export const createBaseExecuteXcm = <TRes>(
  options: TCreateBaseTransferXcmOptions<TRes> & { suffixXcm?: unknown[] }
) => {
  const {
    chain,
    destChain,
    fees: { originFee, reserveFee },
    version,
    paraIdTo,
    transactOptions,
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
    throw new UnsupportedOperationError(
      'Sending local reserve assets with custom fee asset is not yet supported for this chain.'
    )
  }

  const transferType = getInstructionType(version, chain, destChain, reserveChain, transactOptions)

  const isReserveDest = reserveChain === destChain

  const resolvedDepositInstruction = isReserveDest
    ? suffixXcm
    : [
        {
          DepositReserveAsset: {
            assets: createAssetsFilter(assetLocalizedToReserve, version),
            dest: createDestination(version, reserveChain ?? chain, destChain, paraIdTo),
            xcm: [
              ...createPayFees(
                version,
                updateAsset(
                  assetLocalizedToDest,
                  reserveFee === 1000n
                    ? amount / 2n
                    : amount - (feeAsset ? reserveFee : originFee + reserveFee)
                )
              ),
              ...suffixXcm
            ]
          }
        }
      ]

  let mainInstructions

  switch (transferType) {
    case 'InitiateTransfer': {
      const transferFilter = getInitiateTransferType(chain, destChain, reserveChain)
      mainInstructions = [
        {
          InitiateTransfer: {
            destination: destLocation,
            remote_fees: {
              [transferFilter]: createAssetsFilter(assetLocalized, version)
            },
            preserve_origin: true,
            assets: [
              {
                [transferFilter]: createAssetsFilter(assetLocalized, version)
              }
            ],
            remote_xcm: [
              {
                RefundSurplus: undefined
              },
              ...suffixXcm
            ]
          }
        }
      ]
      break
    }

    case 'InitiateTeleport':
      // Use teleport for trusted chains
      mainInstructions = [
        {
          InitiateTeleport: {
            assets: createAssetsFilter(assetLocalized, version),
            dest: destLocation,
            xcm: [
              ...createPayFees(
                version,
                updateAsset(assetLocalizedToDest, feeAsset ? amount : amount - originFee)
              ),
              ...suffixXcm
            ]
          }
        }
      ]
      break

    case 'InitiateTeleportToReserve':
      // Teleport to reserve chain first
      mainInstructions = [
        {
          InitiateTeleport: {
            assets: createAssetsFilter(assetLocalized, version),
            dest: getChainLocation(chain, reserveChain),
            xcm: [
              ...createPayFees(
                version,
                updateAsset(assetLocalizedToReserve, feeAsset ? amount : amount - originFee)
              ),
              // Then deposit to final destination
              ...resolvedDepositInstruction
            ]
          }
        }
      ]
      break

    case 'InitiateReserveWithdraw':
      // For non-trusted chains
      mainInstructions = [
        {
          InitiateReserveWithdraw: {
            assets: createAssetsFilter(assetLocalized, version),
            reserve: getChainLocation(chain, reserveChain),
            xcm: [
              ...createPayFees(
                version,
                // Decrease amount by 2 units becuase for some reason polkadot withdraws 2 units less
                // than requested, so we need to account for that
                updateAsset(assetLocalizedToReserve, amount - 2n)
              ),
              // If the dest is reserve, use just DepositAsset
              // Otherwise, asset needs to be sent to the reserve chain first and then deposited
              ...resolvedDepositInstruction
            ]
          }
        }
      ]
      break

    case 'DepositAsset':
      mainInstructions = resolvedDepositInstruction
  }

  return mainInstructions
}
