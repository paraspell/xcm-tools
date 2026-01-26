// Contains detailed structure of XCM call construction for Polkadot relaychain

import type { TRelaychain, TSubstrateChain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TPolkadotXCMTransferOptions } from '../../types'
import Chain from '../Chain'

class Polkadot<TApi, TRes> extends Chain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor(
    chain: TSubstrateChain = 'Polkadot',
    info: string = 'polkadot',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    return transferPolkadotXcm(input)
  }
}

export default Polkadot
