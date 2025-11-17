import type { Version } from '@paraspell/sdk-common'
import { Parents } from '@paraspell/sdk-common'

import { DEFAULT_FEE_ASSET } from '../../constants'
import type { TRelayToParaOptions } from '../../types'
import { addXcmVersionHeader, createBeneficiaryLocation, resolveParaId } from '../../utils'
import { createVersionedAssets } from '../../utils/asset'
import { createVersionedDestination } from './utils'

export const constructRelayToParaParams = <TApi, TRes>(
  {
    api,
    origin,
    destination,
    assetInfo: asset,
    address,
    paraIdTo
  }: TRelayToParaOptions<TApi, TRes>,
  version: Version
): Record<string, unknown> => {
  const paraId = resolveParaId(paraIdTo, destination)

  const beneficiaryLocation = createBeneficiaryLocation({
    api,
    address: address,
    version
  })

  return {
    dest: createVersionedDestination(version, origin, destination, paraId),
    beneficiary: addXcmVersionHeader(beneficiaryLocation, version),
    assets: createVersionedAssets(version, asset.amount, {
      parents: Parents.ZERO,
      interior: 'Here'
    }),
    fee_asset_item: DEFAULT_FEE_ASSET,
    weight_limit: 'Unlimited'
  }
}
