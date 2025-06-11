import type { Version } from '@paraspell/sdk-common'
import { Parents } from '@paraspell/sdk-common'

import { DEFAULT_FEE_ASSET } from '../../constants'
import type { TRelayToParaOptions } from '../../types'
import { createVersionedBeneficiary, resolveParaId } from '../../utils'
import { createVersionedMultiAssets } from '../../utils/multiAsset'
import { createVersionedDestination } from './utils'

export const constructRelayToParaParameters = <TApi, TRes>(
  { api, destination, asset, address, paraIdTo }: TRelayToParaOptions<TApi, TRes>,
  version: Version,
  { includeFee } = { includeFee: false }
): Record<string, unknown> => {
  const paraId = resolveParaId(paraIdTo, destination)

  return {
    dest: createVersionedDestination('RelayToPara', version, destination, paraId),
    beneficiary: createVersionedBeneficiary({
      api,
      scenario: 'RelayToPara',
      pallet: null,
      recipientAddress: address,
      version,
      paraId
    }),
    assets: createVersionedMultiAssets(version, asset.amount, {
      parents: Parents.ZERO,
      interior: 'Here'
    }),
    fee_asset_item: DEFAULT_FEE_ASSET,
    ...(includeFee && { weight_limit: 'Unlimited' })
  }
}
