import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { normalizeLocation } from '@paraspell/assets'
import type { TSubstrateChain, Version } from '@paraspell/sdk-common'
import { deepEqual, getJunctionValue } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { MIN_AMOUNT, RELAY_LOCATION } from '../../constants'
import { addXcmVersionHeader, createAsset, getRelayChainOf, sortAssets } from '../../utils'
import { createBeneficiaryLocation } from '../../utils/location'

const EMPTY_TOPIC = `0x${'00'.repeat(32)}`

export const getBridgeDestFee = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  destApi: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  origin: TSubstrateChain | TCustomChain,
  destination: TSubstrateChain,
  assetInfo: WithAmount<TAssetInfo>,
  feeAssetInfo: TAssetInfo,
  hasSystemFeeAsset: boolean,
  recipient: string,
  version: Version
): Promise<bigint> => {
  const systemAsset = createAsset(version, MIN_AMOUNT, RELAY_LOCATION)

  const transferredAsset = createAsset(
    version,
    assetInfo.amount,
    normalizeLocation(api.localizeLocation(origin, assetInfo.location), version)
  )

  const assets = hasSystemFeeAsset
    ? sortAssets([systemAsset, transferredAsset])
    : [transferredAsset]

  const destIsReserve = hasSystemFeeAsset
    ? destination === 'AssetHubPolkadot'
    : deepEqual(getJunctionValue(assetInfo.location, 'GlobalConsensus'), {
        [getRelayChainOf(destination).toLowerCase()]: null
      })

  const feeAssetLocation = hasSystemFeeAsset ? RELAY_LOCATION : assetInfo.location

  const buyExecution = {
    BuyExecution: {
      fees: createAsset(
        version,
        MIN_AMOUNT,
        api.localizeLocation(destination, feeAssetLocation, origin)
      ),
      weight_limit: 'Unlimited'
    }
  }

  const depositAsset = {
    DepositAsset: {
      assets: {
        Wild: hasSystemFeeAsset
          ? {
              AllOf: {
                id: api.localizeLocation(destination, assetInfo.location, origin),
                fun: 'Fungible'
              }
            }
          : { AllCounted: 1 }
      },
      beneficiary: createBeneficiaryLocation({ api: destApi, address: recipient, version })
    }
  }

  const feesSplitFromAssets = destIsReserve && hasSystemFeeAsset

  const prologue = feesSplitFromAssets
    ? [
        { ReserveAssetDeposited: [systemAsset] },
        buyExecution,
        { WithdrawAsset: [transferredAsset] },
        { ClearOrigin: null }
      ]
    : [
        destIsReserve ? { WithdrawAsset: assets } : { ReserveAssetDeposited: assets },
        { ClearOrigin: null },
        buyExecution
      ]

  const xcm = [...prologue, buyExecution, depositAsset, { SetTopic: EMPTY_TOPIC }]

  return destApi.getXcmPaymentApiFee(
    destination,
    addXcmVersionHeader(xcm, version),
    [],
    feeAssetInfo,
    version,
    true
  )
}
