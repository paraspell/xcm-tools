// Contains detailed structure of XCM call construction for the IntegriteeKusama Parachain

import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import IntegriteePolkadot from './IntegriteePolkadot'

class IntegriteeKusama<TApi, TRes> extends IntegriteePolkadot<TApi, TRes> {
  constructor(
    chain: TParachain = 'IntegriteeKusama',
    info: string = 'integritee',
    type: TRelaychain = 'Kusama',
    version: Version = Version.V5
  ) {
    super(chain, info, type, version)
  }
}

export default IntegriteeKusama
