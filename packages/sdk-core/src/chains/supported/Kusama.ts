// Contains detailed structure of XCM call construction for Kusama relaychain

import { Version } from '@paraspell/sdk-common'

import Polkadot from './Polkadot'

class Kusama<TApi, TRes, TSigner, TCustomChain extends string = never> extends Polkadot<
  TApi,
  TRes,
  TSigner,
  TCustomChain
> {
  constructor() {
    super('Kusama', 'kusama', 'Kusama', Version.V5)
  }
}

export default Kusama
