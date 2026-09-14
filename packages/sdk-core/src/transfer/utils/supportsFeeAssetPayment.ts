import type { TSubstrateChain } from '@paraspell/sdk-common'

/**
 * Whether the chain can charge the origin transaction fee in a user-selected fee asset.
 */
export const supportsFeeAssetPayment = <TCustomChain extends string = never>(
  chain: TSubstrateChain | TCustomChain
): boolean => chain === 'AssetHubPolkadot' || chain.startsWith('Hydration')
