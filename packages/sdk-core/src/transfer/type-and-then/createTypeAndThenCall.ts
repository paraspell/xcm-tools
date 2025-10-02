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

  const { assetInfo } = context

  const isDotAsset =
    deepEqual(assetInfo.location, RELAY_LOCATION) ||
    deepEqual(assetInfo.location, {
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

  const assetCount = isDotAsset ? 1 : 2

  const refundInstruction = senderAddress
    ? createRefundInstruction(api, senderAddress, version, assetCount)
    : null

  const fees = await computeAllFees(context, customXcm, isDotAsset, refundInstruction)

  const finalCustomXcm = []

  if (refundInstruction) finalCustomXcm.push(refundInstruction)

  finalCustomXcm.push(createCustomXcm(context, isDotAsset, fees))

  const totalFee = fees.reserveFee + fees.destFee + fees.refundFee

  const assets = buildAssets(chain, assetInfo, totalFee, isDotAsset, version)

  return buildTypeAndThenCall(context, isDotAsset, finalCustomXcm, assets)
}
