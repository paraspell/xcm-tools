import { normalizeLocation, type TAssetInfo, type WithAmount } from '@paraspell/assets'
import { isExternalChain, type TSubstrateChain } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { RELAY_LOCATION } from '../../constants'
import { BridgeHaltedError } from '../../errors'
import type {
  TPolkadotXCMTransferOptions,
  TSerializedExtrinsics,
  TTypeAndThenCallContext,
  TTypeAndThenFees,
  TTypeAndThenOverrides
} from '../../types'
import {
  createAsset,
  localizeLocationImpl,
  normalizeAmount,
  parseUnits,
  sortAssets
} from '../../utils'
import { getBridgeStatus } from '../getBridgeStatus'
import { buildTypeAndThenCall } from './buildTypeAndThenCall'
import { computeAllFees } from './computeFees'
import { createTypeAndThenCallContext } from './createContext'
import { createCustomXcm } from './createCustomXcm'

const buildAssets = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  chain: TSubstrateChain | TCustomChain,
  asset: WithAmount<TAssetInfo>,
  feeAmount: bigint,
  isRelayAsset: boolean,
  { version, overriddenAsset }: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
) => {
  if (overriddenAsset) {
    if (Array.isArray(overriddenAsset)) return overriddenAsset
    return [createAsset(version, asset.amount, overriddenAsset)]
  }

  const assets = []

  if (!isRelayAsset) {
    assets.push(createAsset(version, feeAmount, RELAY_LOCATION))
  }

  assets.push(
    createAsset(
      version,
      asset.amount,
      normalizeLocation(localizeLocationImpl(api, chain, asset.location), version)
    )
  )

  return sortAssets(assets)
}

export const resolveAssetCount = <TApi, TRes, TSigner>(
  overriddenAsset: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>['overriddenAsset'],
  isRelayAsset: boolean
): number => {
  if (overriddenAsset) {
    return Array.isArray(overriddenAsset) ? overriddenAsset.length : 1
  }
  return isRelayAsset ? 1 : 2
}

const DEFAULT_SYSTEM_ASSET_AMOUNT = '1'
const DEFAULT_SYSTEM_ASSET_AMOUNT_EXTERNAL = '10'

const resolveSystemAssetAmount = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  { systemAsset, dest }: TTypeAndThenCallContext<TApi, TRes, TSigner, TCustomChain>,
  isForFeeCalc: boolean,
  fees: TTypeAndThenFees
) => {
  if (isForFeeCalc) {
    const defaultAmount = isExternalChain(dest.chain)
      ? DEFAULT_SYSTEM_ASSET_AMOUNT_EXTERNAL
      : DEFAULT_SYSTEM_ASSET_AMOUNT
    return parseUnits(defaultAmount, systemAsset.decimals)
  }
  return normalizeAmount(fees.destFee + fees.hopFees)
}

export const constructTypeAndThenCall = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  context: TTypeAndThenCallContext<TApi, TRes, TSigner, TCustomChain>,
  fees: TTypeAndThenFees | null = null
): Promise<TSerializedExtrinsics> => {
  const { origin, assetInfo, isRelayAsset, options } = context

  const { overriddenAsset } = options

  const assetCount = resolveAssetCount(overriddenAsset, isRelayAsset)

  const resolvedFees = fees ?? {
    hopFees: 0n,
    destFee: 0n
  }

  const isForFeeCalc = fees === null

  const systemAssetAmount = resolveSystemAssetAmount(context, isForFeeCalc, resolvedFees)

  const customXcm = await createCustomXcm(
    context,
    assetCount,
    isForFeeCalc,
    systemAssetAmount,
    resolvedFees
  )

  const assets = buildAssets(
    origin.api,
    origin.chain,
    assetInfo,
    systemAssetAmount,
    isRelayAsset,
    options
  )

  return buildTypeAndThenCall(context, isRelayAsset, customXcm, assets)
}

/**
 * Creates a type and then call for transferring assets using XCM. Works only for DOT and snowbridge assets so far.
 */
export const createTypeAndThenCall = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>,
  overrides: TTypeAndThenOverrides = {
    reserveChain: undefined,
    noFeeAsset: false
  }
): Promise<TSerializedExtrinsics> => {
  const context = await createTypeAndThenCallContext(options, overrides)

  const { origin, assetInfo, isSnowbridge } = context

  if (isSnowbridge) {
    const bridgeStatus = await getBridgeStatus(origin.api.clone())

    if (bridgeStatus !== 'Normal') {
      throw new BridgeHaltedError()
    }
  }

  const fees = await computeAllFees(context, async (amount, relative) => {
    const overridenAmount = amount
      ? relative
        ? assetInfo.amount + parseUnits(amount, assetInfo.decimals)
        : parseUnits(amount, assetInfo.decimals)
      : assetInfo.amount

    return Promise.resolve(
      origin.api.deserializeExtrinsics(
        await constructTypeAndThenCall({
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
