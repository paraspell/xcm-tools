// Contains detailed structure of XCM call construction for Polkadot relaychain

import type { TRelaychain, TSubstrateChain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import Relaychain from './Relaychain'

class Polkadot<TApi, TRes, TSigner, TCustomChain extends string = never> extends Relaychain<
  TApi,
  TRes,
  TSigner,
  TCustomChain
> {
  constructor(
    chain: TSubstrateChain = 'Polkadot',
    info: string = 'polkadot',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }
}

export default Polkadot
