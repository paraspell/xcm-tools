// Contains balance handling for the Ethereum external chain

import type { TAssetInfo } from '@paraspell/assets'
import type { TExternalChain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { getEthErc20Balance } from '../../balance/getEthErc20Balance'
import Chain from '../Chain'

class Ethereum<TApi, TRes, TSigner> extends Chain<TApi, TRes, TSigner, never, TExternalChain> {
  constructor(
    chain: TExternalChain = 'Ethereum',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, ecosystem, version)
  }

  getBalance(
    _api: PolkadotApi<TApi, TRes, TSigner>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    return getEthErc20Balance(this.chain, asset, address)
  }
}

export default Ethereum
