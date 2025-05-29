import { isTMultiLocation, Parents, type TMultiLocation } from '@paraspell/sdk-common'
import { isAddress } from 'viem'

import type { IPolkadotApi } from '../../../api/IPolkadotApi'
import type { TAddress } from '../../../types'

export const buildBeneficiaryInput = <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  address: TAddress
): TMultiLocation => {
  if (isTMultiLocation(address)) {
    return address
  }
  const isEthAddress = isAddress(address)
  return {
    parents: Parents.ZERO,
    interior: {
      X1: isEthAddress
        ? {
            AccountKey20: {
              key: address
            }
          }
        : {
            AccountId32: {
              id: api.accountToHex(address)
            }
          }
    }
  }
}
