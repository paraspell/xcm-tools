import { type TAsset, type TAssetInfo } from '@paraspell/assets'
import type { TChain, TSubstrateChain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'
import { deepEqual, isTrustedChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../../api'
import { RELAY_LOCATION } from '../../../constants'
import { ScenarioNotSupportedError, UnsupportedOperationError } from '../../../errors'
import { createBuyExecution } from '../../../pallets/polkadotXcm'
import type { TCreateTransferXcmOptions, TTransactOptions } from '../../../types'
import { createDestination, getChainLocation } from '../../location'
import { isNativeAssetTeleport } from '../isNativeAssetTeleport'
import { createAllCountedFilter, createAssetsFilter } from './createAssetsFilter'
import { prepareExecuteContext } from './prepareExecuteContext'

const updateAsset = (asset: TAsset, amount: bigint): TAsset => ({
  ...asset,
  fun: {
    Fungible: amount
  }
})

const isTeleportLeg = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  from: TChain | TCustomChain,
  to: TChain | TCustomChain,
  assetInfo: TAssetInfo
) => (isTrustedChain(from) && isTrustedChain(to)) || isNativeAssetTeleport(api, from, to, assetInfo)

const isTeleportableAsset = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  from: TChain | TCustomChain,
  to: TChain | TCustomChain,
  assetInfo: TAssetInfo
) =>
  deepEqual(assetInfo.location, RELAY_LOCATION) || isNativeAssetTeleport(api, from, to, assetInfo)

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
  if (isTeleportLeg(api, origin, destination, assetInfo)) {
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
  if (isTeleportLeg(api, origin, destination, assetInfo)) {
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
    feeAssetInfo,
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
    feeAssetLocalized,
    feeAssetLocalizedToReserve,
    feeAssetLocalizedToDest,
    feeReserveChain,
    reserveChain
  } = prepareExecuteContext(options)

  const isReserveDest = reserveChain === destChain

  const hopFeeAssetToReserve = isReserveDest ? feeAssetLocalizedToDest : feeAssetLocalizedToReserve

  // When fees are paid in a separate asset, originFee is denominated in that asset's
  // currency and must not be subtracted from the transfer amount.
  const originFeeDeduction = feeAsset ? 0n : originFee

  const destLocation = createDestination(api, version, chain, destChain, paraIdTo)

  if (chain !== 'AssetHubPolkadot' && reserveChain === undefined) {
    throw new UnsupportedOperationError(
      'Sending local reserve assets with custom fee asset is not yet supported for this chain.'
    )
  }

  if (feeReserveChain !== undefined && feeReserveChain !== reserveChain) {
    throw new ScenarioNotSupportedError(
      `Fee asset cannot pay fees on hops and destination because its reserve chain (${feeReserveChain}) differs from the reserve chain of the transferred asset (${reserveChain}).`
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

  const createRoutingFilter = (asset: TAsset) =>
    feeAsset ? createAllCountedFilter(2) : createAssetsFilter(asset, version)

  const routingAssetsFilter = createRoutingFilter(assetLocalized)

  const assertFeeAssetTeleportable = (from: TChain | TCustomChain, to: TChain | TCustomChain) => {
    if (feeAsset && feeAssetInfo && !isTeleportableAsset(api, from, to, feeAssetInfo)) {
      throw new ScenarioNotSupportedError(
        `Fee asset ${feeAssetInfo.symbol} cannot be teleported from ${from} to ${to}, so it cannot pay fees there.`
      )
    }
  }

  const reserveToDestInstruction = isTeleportLeg(api, reserveChain ?? chain, destChain, assetInfo)
    ? 'InitiateTeleport'
    : 'DepositReserveAsset'

  const createReserveToDestXcm = () => {
    if (isReserveDest) return suffixXcm

    if (reserveToDestInstruction === 'InitiateTeleport') {
      assertFeeAssetTeleportable(reserveChain ?? chain, destChain)
    }

    return [
      {
        [reserveToDestInstruction]: {
          assets: createRoutingFilter(assetLocalizedToReserve),
          dest: createDestination(api, version, reserveChain ?? chain, destChain, paraIdTo),
          xcm: [
            ...createBuyExecution(
              feeAssetLocalizedToDest ??
                updateAsset(
                  assetLocalizedToDest,
                  reserveFee === 1000n ? amount / 2n : amount - originFeeDeduction - reserveFee
                )
            ),
            ...suffixXcm
          ]
        }
      }
    ]
  }

  let mainInstructions

  switch (transferType) {
    case 'InitiateTransfer': {
      const transferFilter = getInitiateTransferType(api, chain, destChain, assetInfo, reserveChain)
      if (transferFilter === 'Teleport') assertFeeAssetTeleportable(chain, destChain)
      mainInstructions = [
        {
          InitiateTransfer: {
            destination: destLocation,
            remote_fees: {
              [transferFilter]: createAssetsFilter(feeAssetLocalized ?? assetLocalized, version)
            },
            preserve_origin: true,
            assets: [
              {
                [transferFilter]: routingAssetsFilter
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
      assertFeeAssetTeleportable(chain, destChain)
      mainInstructions = [
        {
          InitiateTeleport: {
            assets: routingAssetsFilter,
            dest: destLocation,
            xcm: [
              ...createBuyExecution(
                feeAssetLocalizedToDest ??
                  updateAsset(assetLocalizedToDest, amount - originFeeDeduction)
              ),
              ...suffixXcm
            ]
          }
        }
      ]
      break

    case 'InitiateTeleportToReserve':
      // Teleport to reserve chain first
      assertFeeAssetTeleportable(chain, reserveChain)
      mainInstructions = [
        {
          InitiateTeleport: {
            assets: routingAssetsFilter,
            dest: getChainLocation(chain, reserveChain, api._customCtx),
            xcm: [
              ...createBuyExecution(
                hopFeeAssetToReserve ??
                  updateAsset(assetLocalizedToReserve, amount - originFeeDeduction)
              ),
              // Then deposit to final destination
              ...createReserveToDestXcm()
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
            assets: routingAssetsFilter,
            reserve: getChainLocation(chain, reserveChain, api._customCtx),
            xcm: [
              ...createBuyExecution(
                // Decrease amount by 2 units because for some reason polkadot withdraws 2 units less
                // than requested, so we need to account for that
                hopFeeAssetToReserve ?? updateAsset(assetLocalizedToReserve, amount - 2n)
              ),
              // If the dest is reserve, use just DepositAsset
              // Otherwise, asset needs to be sent to the reserve chain first and then deposited
              ...createReserveToDestXcm()
            ]
          }
        }
      ]
      break

    case 'DepositAsset':
      mainInstructions = createReserveToDestXcm()
  }

  return mainInstructions
}
