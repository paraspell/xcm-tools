// Contains important call creation utils (Selection of fees,formating of header and more.. )

import type { ApiPromise } from '@polkadot/api'
import type { HexString } from '@polkadot/util/types'
import type { TNodeDotKsmWithRelayChains, TNodeWithRelayChains } from '../types'
import { getRelayChainSymbol } from '../pallets/assets'

export const createAccID = (api: ApiPromise, account: string): HexString => {
  console.log('Generating AccountId32 address')
  return api.createType('AccountId32', account).toHex()
}

export const determineRelayChain = (node: TNodeWithRelayChains): TNodeDotKsmWithRelayChains =>
  getRelayChainSymbol(node) === 'KSM' ? 'Kusama' : 'Polkadot'

export const isRelayChain = (node: TNodeWithRelayChains): boolean =>
  node === 'Polkadot' || node === 'Kusama'

export { createX1Payload } from './createX1Payload'
export { deepEqual } from './deepEqual'
export { generateAddressMultiLocationV4 } from './generateAddressMultiLocationV4'
export { generateAddressPayload } from './generateAddressPayload'
export { getNodeProvider } from './getNodeProvider'
export { getAllNodeProviders } from './getAllNodeProviders'
export { getFees } from './getFees'
export { verifyMultiLocation } from './verifyMultiLocation'
export { callPolkadotJsTxFunction } from './callPolkadotJsTxFunction'
export { getNode } from './getNode'
export { createApiInstanceForNode } from './createApiInstanceForNode'
export { getNodeEndpointOption } from './getNodeEndpointOption'
export { createApiInstance } from './createApiInstance'
export { determineRelayChainSymbol } from './determineRelayChainSymbol'
