import { ethers } from 'ethers'
import type { TAddress, TMultiLocation } from '../../../types'
import { Parents } from '../../../types'
import { isTMultiLocation } from '../../xcmPallet/utils'
import type { IPolkadotApi } from '../../../api/IPolkadotApi'

export const buildBeneficiaryInput = <TApi, TRes>(
  api: IPolkadotApi<TApi, TRes>,
  address: TAddress
): TMultiLocation => {
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
              id: api.accountToHex(address)
            }
          }
    }
  }
}
