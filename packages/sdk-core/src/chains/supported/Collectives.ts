// Contains detailed structure of XCM call construction for Collectives Parachain

import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import Chain from '../Chain'

class Collectives<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor(
    chain: TParachain = 'Collectives',
    info: string = 'polkadotCollectives',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
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
