// Contains detailed structure of XCM call construction for Collectives Parachain

import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import Chain from '../Chain'

class Collectives<TApi, TRes> extends Chain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor(
    chain: TParachain = 'Collectives',
    info: string = 'polkadotCollectives',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario, destChain } = input

    if (scenario === 'ParaToPara' && !destChain?.startsWith('AssetHub')) {
      throw new ScenarioNotSupportedError(
        `Unable to use ${this.chain} for transfers to other Parachains.`
      )
    }

    return transferPolkadotXcm(input)
  }
}

export default Collectives
