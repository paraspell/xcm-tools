import { type TAsset, type TAssetInfo } from '@paraspell/assets'
import { isTrustedChain, type TChain, type TSubstrateChain, Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../../api'
import { MissingExecutionFeeError, UnsupportedOperationError } from '../../../errors'
import type { TCreateTransferXcmOptions, TTransactOptions } from '../../../types'
import { createBeneficiaryLocation, createDestination, getChainLocation } from '../../location'
import { isNativeAssetTeleport } from '../isNativeAssetTeleport'
import { createAssetsFilter } from './createAssetsFilter'
import { createExecutionProgram, withV5RefundAppendix } from './createExecutionProgram'
import { prepareExecuteContext } from './prepareExecuteContext'

const updateAsset = (asset: TAsset, amount: bigint): TAsset => ({
  ...asset,
  fun: {
    Fungible: amount
  }
})

const getInstructionType = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  version: Version,
  origin: TSubstrateChain | TCustomChain,
  destination: TChain,
  assetInfo: TAssetInfo,
  reserveChain?: TChain | TCustomChain,
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

  // Trusted chains (or native-asset teleports to/from AssetHub) can teleport
  if (
    (isTrustedChain(origin) && isTrustedChain(destination)) ||
    isNativeAssetTeleport(api, origin, destination, assetInfo)
  ) {
    return 'InitiateTeleport'
  }

  // If we need intermediary reserve (not on reserve chain)
  if (reserveChain !== undefined && origin !== reserveChain) {
    return 'InitiateReserveWithdraw'
  }

  // Direct deposit (either no reserve or we're on reserve)
  return 'DepositAsset'
}

const getInitiateTransferType = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  origin: TSubstrateChain | TCustomChain,
  destination: TChain,
  assetInfo: TAssetInfo,
  reserveChain?: TChain | TCustomChain
) => {
  if (
    (isTrustedChain(origin) && isTrustedChain(destination)) ||
    isNativeAssetTeleport(api, origin, destination, assetInfo)
  ) {
    return 'Teleport'
  }

  if (origin === reserveChain) return 'ReserveDeposit'

  return 'ReserveWithdraw'
}

export const createBaseExecuteXcm = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TCreateTransferXcmOptions<TApi, TRes, TSigner, TCustomChain> & {
    suffixXcm?: unknown[]
  }
) => {
  const {
    api,
    chain,
    destChain,
    assetInfo,
    fees: { originFee, reserveFee, byChain },
    version,
    paraIdTo,
    transactOptions,
    useFeeAssetOnHops,
    sender,
    recipient,
    suffixXcm = []
  } = options

  const {
    amount,
    assetLocalized,
    assetLocalizedToReserve,
    assetLocalizedToDest,
    feeAsset,
    feeAssetLocalized,
    feeAssetLocalizedToReserve,
    feeAssetLocalizedToDest,
    reserveChain
  } = prepareExecuteContext(options)

  const hopFeeAssetToReserve = useFeeAssetOnHops ? feeAssetLocalizedToReserve : undefined
  const hopFeeAssetToDest = useFeeAssetOnHops ? feeAssetLocalizedToDest : undefined
  const reserveExecutionFeeAsset = hopFeeAssetToReserve ?? assetLocalizedToReserve
  const destinationExecutionFeeAsset = hopFeeAssetToDest ?? assetLocalizedToDest

  // When fees are paid in a separate asset, originFee is denominated in that asset's
  // currency and must not be subtracted from the transfer amount.
  const originFeeDeduction = feeAsset ? 0n : originFee

  const destLocation = createDestination(api, version, chain, destChain, paraIdTo)

  if (chain !== 'AssetHubPolkadot' && reserveChain === undefined) {
    throw new UnsupportedOperationError(
      'Sending local reserve assets with custom fee asset is not yet supported for this chain.'
    )
  }

  const transferType = getInstructionType(
    api,
    version,
    chain,
    destChain,
    assetInfo,
    reserveChain,
    transactOptions
  )

  const routingAssetsFilter = feeAsset
    ? { Wild: { AllCounted: 2 } }
    : createAssetsFilter(assetLocalized, version)

  const isReserveDest = reserveChain === destChain

  const recipientBeneficiary = createBeneficiaryLocation({ api, address: recipient, version })
  const senderBeneficiary = createBeneficiaryLocation({
    api,
    address: sender ?? recipient,
    version
  })
  const reserveRefundBeneficiary = isReserveDest ? recipientBeneficiary : senderBeneficiary

  const getExecutionFee = (programChain: TChain | TCustomChain) => {
    const executionFee = byChain?.[programChain]
    if (version >= Version.V5 && byChain !== undefined && executionFee === undefined) {
      throw new MissingExecutionFeeError(programChain)
    }

    return executionFee
  }

  const resolvedDepositInstruction = isReserveDest
    ? suffixXcm
    : [
        {
          DepositReserveAsset: {
            assets: createAssetsFilter(assetLocalizedToReserve, version),
            dest: createDestination(api, version, reserveChain ?? chain, destChain, paraIdTo),
            xcm: createExecutionProgram({
              version,
              feeAsset: destinationExecutionFeeAsset,
              executionFee: getExecutionFee(destChain),
              legacyFeeAsset:
                hopFeeAssetToDest ??
                updateAsset(
                  assetLocalizedToDest,
                  reserveFee === 1000n ? amount / 2n : amount - originFeeDeduction - reserveFee
                ),
              xcm: suffixXcm,
              refundBeneficiary: recipientBeneficiary
            })
          }
        }
      ]

  let mainInstructions: unknown[]

  switch (transferType) {
    case 'InitiateTransfer': {
      const transferFilter = getInitiateTransferType(api, chain, destChain, assetInfo, reserveChain)
      const remoteExecutionFee = getExecutionFee(destChain)
      const remoteFeeAsset =
        remoteExecutionFee !== undefined
          ? updateAsset(
              (useFeeAssetOnHops ? feeAssetLocalized : undefined) ?? assetLocalized,
              remoteExecutionFee
            )
          : undefined
      mainInstructions = [
        {
          InitiateTransfer: {
            destination: destLocation,
            remote_fees: {
              [transferFilter]: remoteFeeAsset
                ? { Definite: [remoteFeeAsset] }
                : routingAssetsFilter
            },
            preserve_origin: true,
            assets: [
              {
                [transferFilter]: routingAssetsFilter
              }
            ],
            remote_xcm: withV5RefundAppendix(version, suffixXcm, recipientBeneficiary)
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
            assets: routingAssetsFilter,
            dest: destLocation,
            xcm: createExecutionProgram({
              version,
              feeAsset: destinationExecutionFeeAsset,
              executionFee: getExecutionFee(destChain),
              legacyFeeAsset:
                hopFeeAssetToDest ?? updateAsset(assetLocalizedToDest, amount - originFeeDeduction),
              xcm: suffixXcm,
              refundBeneficiary: recipientBeneficiary
            })
          }
        }
      ]
      break

    case 'InitiateTeleportToReserve':
      // Teleport to reserve chain first
      mainInstructions = [
        {
          InitiateTeleport: {
            assets: routingAssetsFilter,
            dest: getChainLocation(chain, reserveChain, api._customCtx),
            xcm: createExecutionProgram({
              version,
              feeAsset: reserveExecutionFeeAsset,
              executionFee: getExecutionFee(reserveChain),
              legacyFeeAsset:
                hopFeeAssetToReserve ??
                updateAsset(assetLocalizedToReserve, amount - originFeeDeduction),
              // Then deposit to final destination
              xcm: resolvedDepositInstruction,
              refundBeneficiary: reserveRefundBeneficiary
            })
          }
        }
      ]
      break

    case 'InitiateReserveWithdraw':
      // For non-trusted chains
      mainInstructions = [
        {
          InitiateReserveWithdraw: {
            assets: routingAssetsFilter,
            reserve: getChainLocation(chain, reserveChain, api._customCtx),
            xcm: createExecutionProgram({
              version,
              feeAsset: reserveExecutionFeeAsset,
              executionFee: getExecutionFee(reserveChain),
              // Decrease amount by 2 units because for some reason polkadot withdraws 2 units less
              // than requested, so we need to account for that
              legacyFeeAsset:
                hopFeeAssetToReserve ?? updateAsset(assetLocalizedToReserve, amount - 2n),
              // If the dest is reserve, use just DepositAsset
              // Otherwise, asset needs to be sent to the reserve chain first and then deposited
              xcm: resolvedDepositInstruction,
              refundBeneficiary: reserveRefundBeneficiary
            })
          }
        }
      ]
      break

    case 'DepositAsset':
      mainInstructions = resolvedDepositInstruction
  }

  return mainInstructions
}
