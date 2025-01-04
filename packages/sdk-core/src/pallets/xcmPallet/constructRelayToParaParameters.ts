import { DEFAULT_FEE_ASSET } from '../../constants'
import type { TRelayToParaOptions } from '../../types'
import { Parents, type Version } from '../../types'
import { generateAddressPayload, resolveParaId } from '../../utils'
import { createCurrencySpec, createPolkadotXcmHeader } from './utils'

export const constructRelayToParaParameters = <TApi, TRes>(
  { api, destination, asset, address, paraIdTo }: TRelayToParaOptions<TApi, TRes>,
  version: Version,
  { includeFee } = { includeFee: false }
): Record<string, unknown> => {
  const paraId = resolveParaId(paraIdTo, destination)

  return {
    dest: createPolkadotXcmHeader('RelayToPara', version, destination, paraId),
    beneficiary: generateAddressPayload(api, 'RelayToPara', null, address, version, paraId),
    assets: createCurrencySpec(asset.amount, version, Parents.ZERO),
    fee_asset_item: DEFAULT_FEE_ASSET,
    ...(includeFee && { weight_limit: 'Unlimited' })
  }
}
