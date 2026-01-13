import { type TAssetWithLocation, type WithAmount } from '@paraspell/assets'
import { type TSubstrateChain } from '@paraspell/sdk-common'

import { RELAY_LOCATION } from '../../constants'
import type {
  TPolkadotXCMTransferOptions,
  TSerializedExtrinsics,
  TTypeAndThenCallContext,
  TTypeAndThenFees,
  TTypeAndThenOverrides
} from '../../types'
import { createAsset, localizeLocation, parseUnits, sortAssets } from '../../utils'
import { buildTypeAndThenCall } from './buildTypeAndThenCall'
import { computeAllFees } from './computeFees'
import { createTypeAndThenCallContext } from './createContext'
import { createCustomXcm } from './createCustomXcm'
import { createRefundInstruction } from './utils'

const buildAssets = <TApi, TRes>(
  chain: TSubstrateChain,
  asset: WithAmount<TAssetWithLocation>,
  feeAmount: bigint,
  isRelayAsset: boolean,
  { version, overriddenAsset }: TPolkadotXCMTransferOptions<TApi, TRes>
) => {
  if (overriddenAsset) {
    if (Array.isArray(overriddenAsset)) return overriddenAsset
    return [createAsset(version, asset.amount, overriddenAsset)]
  }

  const assets = []

  if (!isRelayAsset) {
    assets.push(createAsset(version, feeAmount, RELAY_LOCATION))
  }

  assets.push(createAsset(version, asset.amount, localizeLocation(chain, asset.location)))

  return sortAssets(assets)
}

const DEFAULT_SYSTEM_ASSET_AMOUNT = '1'

const resolveSystemAssetAmount = <TApi, TRes>(
  { systemAsset }: TTypeAndThenCallContext<TApi, TRes>,
  isForFeeCalc: boolean,
  fees: TTypeAndThenFees
) => {
  if (isForFeeCalc) {
    return parseUnits(DEFAULT_SYSTEM_ASSET_AMOUNT, systemAsset.decimals)
  }
  return fees.destFee + fees.hopFees
}

export const constructTypeAndThenCall = <TApi, TRes>(
  context: TTypeAndThenCallContext<TApi, TRes>,
  fees: TTypeAndThenFees | null = null
): TSerializedExtrinsics => {
  const { origin, assetInfo, isSubBridge, isRelayAsset, options } = context

  const { senderAddress, version } = options

  const assetCount = isRelayAsset ? 1 : 2

  const refundInstruction =
    senderAddress && !isSubBridge
      ? createRefundInstruction(origin.api, senderAddress, version, assetCount)
      : null

  const resolvedFees = fees ?? {
    hopFees: 0n,
    destFee: 0n
  }

  const isForFeeCalc = fees === null

  const systemAssetAmount = resolveSystemAssetAmount(context, isForFeeCalc, resolvedFees)

  const customXcm = createCustomXcm(
    context,
    assetCount,
    isForFeeCalc,
    systemAssetAmount,
    refundInstruction,
    resolvedFees
  )

  const assets = buildAssets(origin.chain, assetInfo, systemAssetAmount, isRelayAsset, options)

  return buildTypeAndThenCall(context, isRelayAsset, customXcm, assets)
}

/**
 * Creates a type and then call for transferring assets using XCM. Works only for DOT and snowbridge assets so far.
 */
export const createTypeAndThenCall = async <TApi, TRes>(
  options: TPolkadotXCMTransferOptions<TApi, TRes>,
  overrides: TTypeAndThenOverrides = {
    reserveChain: undefined,
    noFeeAsset: false
  }
): Promise<TSerializedExtrinsics> => {
  const context = await createTypeAndThenCallContext(options, overrides)

  const { origin, assetInfo } = context

  const fees = await computeAllFees(context, (amount, relative) => {
    const overridenAmount = amount
      ? relative
        ? assetInfo.amount + parseUnits(amount, assetInfo.decimals)
        : parseUnits(amount, assetInfo.decimals)
      : assetInfo.amount

    return Promise.resolve(
      origin.api.deserializeExtrinsics(
        constructTypeAndThenCall({
          ...context,
          assetInfo: {
            ...assetInfo,
            amount: overridenAmount
          }
        })
      )
    )
  })

  return constructTypeAndThenCall(context, fees)
}
