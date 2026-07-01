// Contains detailed structure of XCM call construction for CoretimePolkadot Parachain

import type { TChain, TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import SubstrateChain from '../SubstrateChain'

class CoretimePolkadot<TApi, TRes, TSigner>
  extends SubstrateChain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor(
    chain: TParachain = 'CoretimePolkadot',
    info: string = 'polkadotCoretime',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    const { scenario } = input

    if (scenario === 'ParaToPara') {
      throw new ScenarioNotSupportedError({ chain: this.chain, scenario })
    }

    return transferPolkadotXcm(input)
  }

  canReceiveFrom<TCustomChain extends string = never>(origin: TChain | TCustomChain): boolean {
    return origin !== 'Hydration' && origin !== 'Moonbeam'
  }
}

export default CoretimePolkadot
