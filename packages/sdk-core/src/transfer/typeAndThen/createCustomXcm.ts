import { MIN_FEE, RELAY_LOCATION } from '../../constants'
import { createDestination } from '../../pallets/xcmPallet/utils'
import type { TTypeAndThenCallContext, TTypeAndThenFees } from '../../types'
import { createAsset, createBeneficiaryLocation, localizeLocation } from '../../utils'

export const createCustomXcm = <TApi, TRes>(
  { origin, dest, reserve, assetInfo, options }: TTypeAndThenCallContext<TApi, TRes>,
  isDotAsset: boolean,
  fees: TTypeAndThenFees = {
    reserveFee: MIN_FEE,
    refundFee: 0n,
    destFee: MIN_FEE
  }
) => {
  const { destination, version, address, paraIdTo } = options
  const { reserveFee, refundFee, destFee } = fees

  const feeAssetLocation = !isDotAsset ? RELAY_LOCATION : assetInfo.location

  const asset = createAsset(
    version,
    assetInfo.amount,
    localizeLocation(dest.chain, assetInfo.location)
  )

  const depositInstruction = {
    DepositAsset: {
      assets: {
        Wild: {
          AllOf: {
            id: asset.id,
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
      createAsset(version, reserveFee + destFee, localizeLocation(reserve.chain, RELAY_LOCATION))
    )

  assetsFilter.push(
    createAsset(version, assetInfo.amount, localizeLocation(reserve.chain, assetInfo.location))
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
                fees: createAsset(
                  version,
                  !isDotAsset ? destFee : assetInfo.amount - reserveFee - refundFee,
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
