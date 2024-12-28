import { DEFAULT_FEE_ASSET } from '../../constants'
import { getParaId } from '../../nodes/config'
import type { TRelayToParaOptions } from '../../types'
import { Parents, type Version } from '../../types'
import { generateAddressPayload, isRelayChain } from '../../utils'
import { createCurrencySpec, createPolkadotXcmHeader, isTMultiLocation } from './utils'

export const constructRelayToParaParameters = <TApi, TRes>(
  { api, destination, asset, address, paraIdTo }: TRelayToParaOptions<TApi, TRes>,
  version: Version,
  { includeFee } = { includeFee: false }
): Record<string, unknown> => {
  const isRelayDestination = !isTMultiLocation(destination) && isRelayChain(destination)

  const paraId =
    !isRelayDestination && typeof destination !== 'object'
      ? (paraIdTo ?? getParaId(destination))
      : undefined

  return {
    dest: createPolkadotXcmHeader('RelayToPara', version, destination, paraId),
    beneficiary: generateAddressPayload(api, 'RelayToPara', null, address, version, paraId),
    assets: createCurrencySpec(asset.amount, version, Parents.ZERO),
    fee_asset_item: DEFAULT_FEE_ASSET,
    ...(includeFee && { weight_limit: 'Unlimited' })
  }
}
