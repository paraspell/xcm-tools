import { type TAssetWithLocation, type WithAmount } from '@paraspell/assets'
import type { Version } from '@paraspell/sdk-common'
import { deepEqual, isRelayChain, type TSubstrateChain } from '@paraspell/sdk-common'

import { RELAY_LOCATION } from '../../constants'
import type { TPolkadotXCMTransferOptions, TSerializedApiCall } from '../../types'
import { createAsset, localizeLocation } from '../../utils'
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

  if (!isDotAsset) {
    assets.push(createAsset(version, feeAmount, RELAY_LOCATION))
  }

  assets.push(
    createAsset(
      version,
      asset.amount,
      isRelayChain(chain) ? localizeLocation(chain, asset.location) : asset.location
    )
  )

  return assets
}

/**
 * Creates a type and then call for transferring assets using XCM. Works only for DOT and snowbridge assets so far.
 */
export const createTypeAndThenCall = async <TApi, TRes>(
  chain: TSubstrateChain,
  options: TPolkadotXCMTransferOptions<TApi, TRes>,
  overrideReserve?: TSubstrateChain
): Promise<TSerializedApiCall> => {
  const { api, senderAddress, version } = options

  const context = await createTypeAndThenCallContext(chain, options, overrideReserve)

  const { assetInfo, isSubBridge } = context

  const LOCATIONS = [
    RELAY_LOCATION,
    {
      parents: 2,
      interior: { X1: [{ GlobalConsensus: { Kusama: null } }] }
    },
    {
      parents: 2,
      interior: { X1: [{ GlobalConsensus: { Polkadot: null } }] }
    }
  ]

  const isRelayAsset = LOCATIONS.some(loc => deepEqual(assetInfo.location, loc))

  const assetCount = isRelayAsset ? 1 : 2

  const customXcm = createCustomXcm(context, isRelayAsset, assetCount, true)

  const refundInstruction = senderAddress
    ? createRefundInstruction(api, senderAddress, version, assetCount)
    : null

  const fees = await computeAllFees(context, customXcm, isRelayAsset, refundInstruction)

  const finalCustomXcm = []

  if (refundInstruction && !isSubBridge) finalCustomXcm.push(refundInstruction)

  finalCustomXcm.push(...createCustomXcm(context, isRelayAsset, assetCount, false, fees))

  const totalFee = fees.reserveFee + fees.destFee + fees.refundFee

  const assets = buildAssets(chain, assetInfo, totalFee, isRelayAsset, version)

  return buildTypeAndThenCall(context, isRelayAsset, finalCustomXcm, assets)
}
