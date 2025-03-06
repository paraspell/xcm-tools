import { getSupportedPalletsDetails } from '../../pallets/pallets'
import {
  PolkadotXcmError,
  type TModuleError,
  type TNodeDotKsmWithRelayChains,
  XTokensError
} from '../../types'

export const resolveModuleError = (node: TNodeDotKsmWithRelayChains, error: TModuleError) => {
  const palletDetails = getSupportedPalletsDetails(node).find(p => p.index === Number(error.index))

  if (!palletDetails) {
    throw new Error(`Pallet with index ${error.index} not found`)
  }

  // Use only the first byte of the error to get the error index
  const errorIndex = Number(error.error.slice(0, 4))

  const { name } = palletDetails

  if (name !== 'XTokens' && name !== 'PolkadotXcm' && name !== 'XcmPallet') {
    throw new Error(`Pallet ${name} is not supported`)
  }

  const failureReason =
    name === 'XTokens'
      ? Object.values(XTokensError)[errorIndex]
      : Object.values(PolkadotXcmError)[errorIndex]

  if (!failureReason) {
    throw new Error(`Error index ${errorIndex} not found in ${name} pallet`)
  }

  return failureReason
}
