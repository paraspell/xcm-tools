import type { ApiPromise } from '@polkadot/api'
import { ethers } from 'ethers'
import type { TAddress, TMultiLocation } from '../../../types'
import { Parents } from '../../../types'
import { createAccountId } from '../../../utils'
import { isTMultiLocation } from '../../xcmPallet/utils'

export const buildBeneficiaryInput = (api: ApiPromise, address: TAddress): TMultiLocation => {
  if (isTMultiLocation(address)) {
    return address
  }
  const isEthAddress = ethers.isAddress(address)
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
              id: createAccountId(api, address)
            }
          }
    }
  }
}
