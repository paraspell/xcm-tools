import type { TChain, TLocation, Version } from '@paraspell/sdk-common'
import { deepEqual } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { createAsset, createAssetId } from '../asset'

export const createEdExchangeInstructions = <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  destChain: TChain,
  version: Version,
  feeLocation: TLocation,
  isFeeTransferred: boolean
) => {
  const { location, existentialDeposit } = api.findNativeAssetInfoOrThrow(destChain)
  const nativeLocation = api.localizeLocation(destChain, location)

  if (deepEqual(feeLocation, nativeLocation)) return []

  return [
    {
      ExchangeAsset: {
        give: { Wild: { AllOf: { id: createAssetId(version, feeLocation), fun: 'Fungible' } } },
        want: [createAsset(version, BigInt(existentialDeposit), nativeLocation)],
        maximal: !isFeeTransferred
      }
    }
  ]
}
