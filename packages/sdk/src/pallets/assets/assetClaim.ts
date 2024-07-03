import { ethers } from 'ethers'
import {
  type Extrinsic,
  Parents,
  type TAddress,
  type TMultiLocation,
  type TSerializedApiCall,
  Version
} from '../../types'
import { type TAssetClaimOptions } from '../../types/TAssetClaim'
import { isTMultiLocation } from '../xcmPallet/utils'
import { createAccID, createApiInstanceForNode, isRelayChain } from '../../utils'
import { type ApiPromise } from '@polkadot/api'

const buildBeneficiaryInput = (api: ApiPromise, address: TAddress): TMultiLocation => {
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
              id: createAccID(api, address)
            }
          }
    }
  }
}

const buildClaimAssetsInput = ({
  api,
  multiAssets,
  address,
  version = Version.V3
}: TAssetClaimOptions) => [
  {
    [version]: multiAssets
  },
  {
    [version]: buildBeneficiaryInput(api as ApiPromise, address)
  }
]

const MODULE = 'polkadotXcm'
const MODULE_RELAY = 'xcmPallet'
const SECTION = 'claimAssets'

const claimAssets = async (
  options: TAssetClaimOptions
): Promise<Extrinsic | TSerializedApiCall> => {
  const { api, node, serializedApiCallEnabled } = options

  const apiWithFallback = api ?? (await createApiInstanceForNode(node))

  const args = buildClaimAssetsInput({
    ...options,
    api: apiWithFallback
  })

  const module = isRelayChain(node) ? MODULE_RELAY : MODULE

  if (serializedApiCallEnabled === true) {
    return {
      module,
      section: SECTION,
      parameters: args
    }
  }

  return apiWithFallback.tx[module][SECTION](...args)
}

export default claimAssets
