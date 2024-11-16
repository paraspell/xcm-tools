import { DEFAULT_FEE_ASSET } from '../../const'
import { getParaId } from '../../nodes/config'
import { Parents, type TRelayToParaOptions, type Version } from '../../types'
import { generateAddressPayload } from '../../utils'
import { createCurrencySpec, createPolkadotXcmHeader } from './utils'

export const constructRelayToParaParameters = <TApi, TRes>(
  { api, destination, address, amount, paraIdTo }: TRelayToParaOptions<TApi, TRes>,
  version: Version,
  includeFee = false
): Record<string, unknown> => {
  // Handle the case when a destination is a multi-location
  const paraId =
    destination !== undefined && typeof destination !== 'object'
      ? (paraIdTo ?? getParaId(destination))
      : undefined

  return {
    dest: createPolkadotXcmHeader('RelayToPara', version, destination, paraId),
    beneficiary: generateAddressPayload(api, 'RelayToPara', null, address, version, paraId),
    assets: createCurrencySpec(amount, version, Parents.ZERO),
    fee_asset_item: DEFAULT_FEE_ASSET,
    ...(includeFee && { weight_limit: 'Unlimited' })
  }
}
