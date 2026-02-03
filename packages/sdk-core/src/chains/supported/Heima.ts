// Contains detailed structure of XCM call construction for Heima Parachain

import { InvalidCurrencyError } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TPolkadotXCMTransferOptions } from '../../types'
import Chain from '../Chain'

class Heima<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor(
    chain: TParachain = 'Heima',
    info: string = 'heima',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    const { scenario, assetInfo: asset } = input

    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError({ chain: this.chain, scenario })
    }

    if (asset.symbol !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(
        `Asset ${asset.symbol} is not supported by chain ${this.chain}.`
      )
    }

    return transferPolkadotXcm(input)
  }
}

export default Heima
