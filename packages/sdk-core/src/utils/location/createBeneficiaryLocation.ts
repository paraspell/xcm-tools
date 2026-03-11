import type { TJunction, TLocation } from '@paraspell/sdk-common'
import { isTLocation, Parents } from '@paraspell/sdk-common'
import { isAddress } from 'viem'

import type { IPolkadotApi } from '../../api'
import type { TCreateBeneficiaryOptions, TCreateBeneficiaryXTokensOptions } from '../../types'
import { resolveScenario } from '../transfer/resolveScenario'
import { createX1Payload } from './createX1Payload'

const createAccountPayload = <TApi, TRes, TSigner>(
  api: IPolkadotApi<TApi, TRes, TSigner>,
  address: string
): TJunction =>
  isAddress(address)
    ? { AccountKey20: { key: address } }
    : { AccountId32: { id: api.accountToHex(address) } }

export const createBeneficiaryLocXTokens = <TApi, TRes, TSigner>({
  api,
  address: recipientAddress,
  origin,
  destination,
  version,
  paraId
}: TCreateBeneficiaryXTokensOptions<TApi, TRes, TSigner>): TLocation => {
  if (isTLocation(recipientAddress)) {
    return recipientAddress
  }

  const scenario = resolveScenario(origin, destination)

  const accountPayload = createAccountPayload(api, recipientAddress)

  if (scenario === 'ParaToRelay') {
    return {
      parents: Parents.ONE,
      interior: createX1Payload(version, {
        AccountId32: {
          id: api.accountToHex(recipientAddress)
        }
      })
    }
  } else if (scenario === 'ParaToPara') {
    return {
      parents: Parents.ONE,
      interior: {
        X2: [{ Parachain: paraId }, accountPayload]
      }
    }
  }

  return {
    parents: Parents.ZERO,
    interior: createX1Payload(version, accountPayload)
  }
}

export const createBeneficiaryLocation = <TApi, TRes, TSigner>({
  api,
  address,
  version
}: TCreateBeneficiaryOptions<TApi, TRes, TSigner>): TLocation => {
  if (isTLocation(address)) return address

  const accountPayload = createAccountPayload(api, address)

  return {
    parents: Parents.ZERO,
    interior: createX1Payload(version, accountPayload)
  }
}
