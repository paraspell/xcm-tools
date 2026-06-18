import { TLocation, TSubstrateChain } from '@paraspell/sdk-common'
import { PolkadotClient } from 'polkadot-api'
import { TAssetInfo } from '../src'

export type TAssetInfoNoLoc = Omit<TAssetInfo, 'location'> & { location?: TLocation }

export type TAssetsFetcher = (
  client: PolkadotClient,
  chain: TSubstrateChain
) => Promise<TAssetInfoNoLoc[]>
