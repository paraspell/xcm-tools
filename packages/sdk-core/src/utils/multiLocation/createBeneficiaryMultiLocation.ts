import type { TMultiLocation } from '@paraspell/sdk-common'
import { isTMultiLocation, Parents } from '@paraspell/sdk-common'
import { isAddress } from 'viem'

import type { TCreateBeneficiaryOptions } from '../../types'
import { Version } from '../../types'
import { createX1Payload } from '../createX1Payload'

export const createBeneficiaryMultiLocation = <TApi, TRes>({
  api,
  scenario,
  pallet,
  recipientAddress,
  version,
  paraId
}: TCreateBeneficiaryOptions<TApi, TRes>): TMultiLocation => {
  if (isTMultiLocation(recipientAddress)) {
    return recipientAddress
  }

  const isEthAddress = isAddress(recipientAddress)

  const getAccountPayload = (allowNetwork: boolean) => {
    if (isEthAddress) {
      return {
        AccountKey20: {
          key: recipientAddress,
          ...(allowNetwork ? { network: 'any' } : {})
        }
      }
    }
    return {
      AccountId32: {
        id: api.accountToHex(recipientAddress),
        ...(allowNetwork ? { network: 'any' } : {})
      }
    }
  }

  if (scenario === 'ParaToRelay') {
    return {
      parents: pallet === 'XTokens' ? Parents.ONE : Parents.ZERO,
      interior: createX1Payload(version, {
        AccountId32: {
          id: api.accountToHex(recipientAddress),
          ...(version === Version.V1 ? { network: 'any' } : {})
        }
      })
    }
  } else if (scenario === 'ParaToPara' && pallet === 'XTokens') {
    return {
      parents: Parents.ONE,
      interior: {
        X2: [{ Parachain: paraId }, getAccountPayload(version === Version.V1)]
      }
    }
  } else if (scenario === 'ParaToPara' && pallet === 'PolkadotXcm') {
    return {
      parents: Parents.ZERO,
      interior: createX1Payload(version, getAccountPayload(version === Version.V1))
    }
  } else {
    return {
      parents: Parents.ZERO,
      interior: createX1Payload(version, getAccountPayload(false))
    }
  }
}
