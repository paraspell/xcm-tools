import { MIN_FEE, RELAY_LOCATION } from '../../constants'
import { createDestination } from '../../pallets/xcmPallet/utils'
import type { TTypeAndThenCallContext, TTypeAndThenFees } from '../../types'
import { createBeneficiaryLocation, createMultiAsset, localizeLocation } from '../../utils'

export const createCustomXcm = <TApi, TRes>(
  { origin, dest, reserve, asset, options }: TTypeAndThenCallContext<TApi, TRes>,
  isDotAsset: boolean,
  fees: TTypeAndThenFees = {
    reserveFee: MIN_FEE,
    refundFee: 0n,
    destFee: MIN_FEE
  }
) => {
  const { destination, version, address, paraIdTo } = options
  const { reserveFee, refundFee, destFee } = fees

  const feeAssetLocation = !isDotAsset ? RELAY_LOCATION : asset.multiLocation

  const multiAsset = createMultiAsset(
    version,
    asset.amount,
    localizeLocation(dest.chain, asset.multiLocation)
  )

  const depositInstruction = {
    DepositAsset: {
      assets: {
        Wild: {
          AllOf: {
            id: multiAsset.id,
            fun: 'Fungible'
          }
        }
      },
      beneficiary: createBeneficiaryLocation({
        api: origin.api,
        address,
        version
      })
    }
  }

  const assetsFilter = []

  if (!isDotAsset)
    assetsFilter.push(
      createMultiAsset(
        version,
        reserveFee + destFee,
        localizeLocation(reserve.chain, RELAY_LOCATION)
      )
    )

  assetsFilter.push(
    createMultiAsset(version, asset.amount, localizeLocation(reserve.chain, asset.multiLocation))
  )

  return origin.chain !== reserve.chain && dest.chain !== reserve.chain
    ? {
        DepositReserveAsset: {
          assets:
            fees.destFee === MIN_FEE
              ? { Wild: 'All' }
              : {
                  Definite: assetsFilter
                },
          dest: createDestination(version, origin.chain, destination, paraIdTo),
          xcm: [
            {
              BuyExecution: {
                fees: createMultiAsset(
                  version,
                  !isDotAsset ? destFee : asset.amount - reserveFee - refundFee,
                  feeAssetLocation
                ),
                weight_limit: 'Unlimited'
              }
            },
            depositInstruction
          ]
        }
      }
    : depositInstruction
}
