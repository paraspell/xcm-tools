import type { TNodeWithRelayChains } from '@paraspell/sdk-common'
import { type TNodeDotKsmWithRelayChains } from '@paraspell/sdk-common'

import { getParaId } from '../../nodes/config'
import { createDestination, createVersionedDestination } from '../../pallets/xcmPallet/utils'
import type { TPolkadotXCMTransferOptions, TSerializedApiCall } from '../../types'
import {
  addXcmVersionHeader,
  assertHasLocation,
  createBeneficiaryLocation,
  createMultiAsset
} from '../../utils'

export const createTypeAndThenCall = <TApi, TRes>(
  chain: TNodeDotKsmWithRelayChains,
  destChain: TNodeWithRelayChains,
  reserveChain: TNodeDotKsmWithRelayChains,
  input: TPolkadotXCMTransferOptions<TApi, TRes>,
  reserveFee: bigint
): TSerializedApiCall => {
  const { api, destination, asset, version, address, paraIdTo } = input

  assertHasLocation(asset)

  const depositInstruction = {
    DepositAsset: {
      assets: { Wild: 'All' },
      beneficiary: createBeneficiaryLocation({
        api,
        address,
        version
      })
    }
  }

  const customXcm =
    chain === reserveChain || destChain === reserveChain
      ? [depositInstruction]
      : [
          {
            DepositReserveAsset: {
              assets: {
                Wild: 'All'
              },
              dest: createDestination(version, chain, destination, paraIdTo),
              xcm: [
                {
                  BuyExecution: {
                    fees: createMultiAsset(version, reserveFee, asset.multiLocation),
                    weight_limit: 'Unlimited'
                  }
                },
                depositInstruction
              ]
            }
          }
        ]

  const finalDest = chain === reserveChain ? destChain : reserveChain

  const dest = createVersionedDestination(version, chain, finalDest, getParaId(finalDest))
  const multiAsset = createMultiAsset(version, asset.amount, asset.multiLocation)
  const assets = addXcmVersionHeader([multiAsset], version)
  const customXcmVersioned = addXcmVersionHeader(customXcm, version)

  const feesLocation = addXcmVersionHeader(multiAsset.id, version)

  const reserve = chain === reserveChain ? 'LocalReserve' : 'DestinationReserve'

  return {
    module: 'PolkadotXcm',
    method: 'transfer_assets_using_type_and_then',
    parameters: {
      dest: dest,
      assets: assets,
      assets_transfer_type: reserve,
      remote_fees_id: feesLocation,
      fees_transfer_type: reserve,
      custom_xcm_on_dest: customXcmVersioned,
      weight_limit: 'Unlimited'
    }
  }
}
