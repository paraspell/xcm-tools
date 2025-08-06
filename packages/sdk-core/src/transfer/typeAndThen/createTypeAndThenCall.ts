import { type TAssetWithLocation, type WithAmount } from '@paraspell/assets'
import type { Version } from '@paraspell/sdk-common'
import { deepEqual, type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import { RELAY_LOCATION } from '../../constants'
import type { TPolkadotXCMTransferOptions, TSerializedApiCall } from '../../types'
import { createMultiAsset } from '../../utils'
import { buildTypeAndThenCall } from './buildTypeAndThenCall'
import { computeAllFees } from './computeFees'
import { createTypeAndThenCallContext } from './createContext'
import { createCustomXcm } from './createCustomXcm'
import { createRefundInstruction } from './utils'

const buildAssets = (
  asset: WithAmount<TAssetWithLocation>,
  feeAmount: bigint,
  isDotAsset: boolean,
  version: Version
) => {
  const assets = []

  if (!isDotAsset) {
    assets.push(createMultiAsset(version, feeAmount, RELAY_LOCATION))
  }

  assets.push(createMultiAsset(version, asset.amount, asset.multiLocation))

  return assets
}

/**
 * Creates a type and then call for transferring assets using XCM. Works only for DOT and snowbridge assets so far.
 */
export const createTypeAndThenCall = async <TApi, TRes>(
  chain: TNodeDotKsmWithRelayChains,
  options: TPolkadotXCMTransferOptions<TApi, TRes>
): Promise<TSerializedApiCall> => {
  const { api, senderAddress, version } = options

  const context = await createTypeAndThenCallContext(chain, options)

  const { asset } = context

  const isDotAsset =
    deepEqual(asset.multiLocation, RELAY_LOCATION) ||
    deepEqual(asset.multiLocation, {
      parents: 2,
      interior: {
        X1: [
          {
            GlobalConsensus: {
              Kusama: null
            }
          }
        ]
      }
    })

  const customXcm = createCustomXcm(context, isDotAsset)

  const refundInstruction = senderAddress
    ? createRefundInstruction(api, senderAddress, version)
    : null

  const fees = await computeAllFees(context, customXcm, isDotAsset, refundInstruction)

  const finalCustomXcm = []

  if (refundInstruction) finalCustomXcm.push(refundInstruction)

  finalCustomXcm.push(createCustomXcm(context, isDotAsset, fees))

  const totalFee = fees.reserveFee + fees.destFee + fees.refundFee

  const assets = buildAssets(asset, totalFee, isDotAsset, version)

  return buildTypeAndThenCall(context, isDotAsset, finalCustomXcm, assets)
}
