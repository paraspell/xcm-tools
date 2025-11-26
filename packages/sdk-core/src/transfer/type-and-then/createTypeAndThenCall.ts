import { type TAssetWithLocation, type WithAmount } from '@paraspell/assets'
import type { Version } from '@paraspell/sdk-common'
import { isRelayChain, type TSubstrateChain } from '@paraspell/sdk-common'

import { RELAY_LOCATION } from '../../constants'
import type {
  TPolkadotXCMTransferOptions,
  TSerializedExtrinsics,
  TTypeAndThenCallContext,
  TTypeAndThenFees
} from '../../types'
import { createAsset, localizeLocation, parseUnits, sortAssets } from '../../utils'
import { buildTypeAndThenCall } from './buildTypeAndThenCall'
import { computeAllFees } from './computeFees'
import { createTypeAndThenCallContext } from './createContext'
import { createCustomXcm } from './createCustomXcm'
import { createRefundInstruction } from './utils'

const buildAssets = (
  chain: TSubstrateChain,
  asset: WithAmount<TAssetWithLocation>,
  feeAmount: bigint,
  isDotAsset: boolean,
  version: Version
) => {
  const assets = []

  const shouldLocalizeAndSort = isRelayChain(chain) || chain.startsWith('AssetHub')

  if (!isDotAsset) {
    assets.push(createAsset(version, feeAmount, RELAY_LOCATION))
  }

  assets.push(
    createAsset(
      version,
      asset.amount,
      shouldLocalizeAndSort ? localizeLocation(chain, asset.location) : asset.location
    )
  )

  return shouldLocalizeAndSort ? sortAssets(assets) : assets
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
  const {
    origin,
    assetInfo,
    isSubBridge,
    isRelayAsset,
    options: { senderAddress, version }
  } = context

  const assetCount = isRelayAsset ? 1 : 2

  const refundInstruction = senderAddress
    ? createRefundInstruction(origin.api, senderAddress, version, assetCount)
    : null

  const finalCustomXcm = []

  if (refundInstruction && !isSubBridge) finalCustomXcm.push(refundInstruction)

  const resolvedFees = fees ?? {
    hopFees: 0n,
    destFee: 0n
  }

  const isForFeeCalc = fees === null

  const systemAssetAmount = resolveSystemAssetAmount(context, isForFeeCalc, resolvedFees)

  finalCustomXcm.push(
    ...createCustomXcm(context, assetCount, isForFeeCalc, systemAssetAmount, resolvedFees)
  )

  const assets = buildAssets(origin.chain, assetInfo, systemAssetAmount, isRelayAsset, version)

  return buildTypeAndThenCall(context, isRelayAsset, finalCustomXcm, assets)
}

/**
 * Creates a type and then call for transferring assets using XCM. Works only for DOT and snowbridge assets so far.
 */
export const createTypeAndThenCall = async <TApi, TRes>(
  chain: TSubstrateChain,
  options: TPolkadotXCMTransferOptions<TApi, TRes>,
  overrideReserve?: TSubstrateChain
): Promise<TSerializedExtrinsics> => {
  const context = await createTypeAndThenCallContext(chain, options, overrideReserve)

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
