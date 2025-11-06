import { getSupportedPalletsDetails } from '@paraspell/pallets'
import type { TSubstrateChain } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../errors'
import type { TDryRunError } from '../../types'
import {
  PolkadotXcmError,
  PolkadotXcmExecutionError,
  type TModuleError,
  XTokensError
} from '../../types'

export const resolveModuleError = (chain: TSubstrateChain, error: TModuleError): TDryRunError => {
  const palletDetails = getSupportedPalletsDetails(chain).find(p => p.index === Number(error.index))

  if (!palletDetails) {
    throw new InvalidParameterError(`Pallet with index ${error.index} not found`)
  }

  // Use only the first byte of the error to get the error index
  // Including 0x prefix
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

  if (failureReason === PolkadotXcmError.LocalExecutionIncompleteWithError) {
    const subErrorIndex = Number(`0x${error.error.slice(6, 8)}`)
    const failureSubReason = Object.values(PolkadotXcmExecutionError)[subErrorIndex]

    if (!failureSubReason) {
      throw new InvalidParameterError(
        `Sub-error index ${subErrorIndex} not found in PolkadotXcm pallet`
      )
    }

    return { failureReason, failureSubReason }
  }

  return { failureReason }
}
