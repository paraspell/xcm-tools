import type { TMultiLocation } from '@paraspell/sdk-common'
import { isTMultiLocation, Parents } from '@paraspell/sdk-common'
import { isAddress } from 'viem'

import type { TCreateBeneficiaryOptions } from '../../types'
import { createX1Payload } from './createX1Payload'

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

  const accountPayload = isEthAddress
    ? {
        AccountKey20: {
          key: recipientAddress
        }
      }
    : {
        AccountId32: {
          id: api.accountToHex(recipientAddress)
        }
      }

  if (scenario === 'ParaToRelay') {
    return {
      parents: pallet === 'XTokens' ? Parents.ONE : Parents.ZERO,
      interior: createX1Payload(version, {
        AccountId32: {
          id: api.accountToHex(recipientAddress)
        }
      })
    }
  } else if (scenario === 'ParaToPara' && pallet === 'XTokens') {
    return {
      parents: Parents.ONE,
      interior: {
        X2: [{ Parachain: paraId }, accountPayload]
      }
    }
  } else if (scenario === 'ParaToPara' && pallet === 'PolkadotXcm') {
    return {
      parents: Parents.ZERO,
      interior: createX1Payload(version, accountPayload)
    }
  } else {
    return {
      parents: Parents.ZERO,
      interior: createX1Payload(version, accountPayload)
    }
  }
}
