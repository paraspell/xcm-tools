import { getSupportedPalletsDetails } from '@paraspell/pallets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../errors'
import { PolkadotXcmError, type TModuleError, XTokensError } from '../../types'

export const resolveModuleError = (chain: TSubstrateChain, error: TModuleError) => {
  const palletDetails = getSupportedPalletsDetails(chain).find(p => p.index === Number(error.index))

  if (!palletDetails) {
    throw new InvalidParameterError(`Pallet with index ${error.index} not found`)
  }

  // Use only the first byte of the error to get the error index
  const errorIndex = Number(error.error.slice(0, 4))

  const { name } = palletDetails

  if (name !== 'XTokens' && name !== 'PolkadotXcm' && name !== 'XcmPallet') {
    throw new InvalidParameterError(`Pallet ${name} is not supported`)
  }

  const failureReason =
    name === 'XTokens'
      ? Object.values(XTokensError)[errorIndex]
      : Object.values(PolkadotXcmError)[errorIndex]

  if (!failureReason) {
    throw new InvalidParameterError(`Error index ${errorIndex} not found in ${name} pallet`)
  }

  return failureReason
}
