// Contains detailed structure of XCM call construction for Laos Parachain

import { InvalidCurrencyError } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError, TransferToAhNotSupported } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TPolkadotXCMTransferOptions } from '../../types'
import Chain from '../Chain'

class Laos<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor(
    chain: TParachain = 'Laos',
    info: string = 'laos',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, ecosystem, version)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    const { scenario, assetInfo: asset, destination } = input

    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError({ chain: this.chain, scenario })
    }

    if (asset.symbol !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(
        `Asset ${asset.symbol} is not supported by chain ${this.chain}.`
      )
    }

    if (destination === 'AssetHubPolkadot') {
      throw new TransferToAhNotSupported('Transfer from Laos to AssetHubPolkadot is not supported.')
    }

    return transferPolkadotXcm(input)
  }

  isRelayToParaEnabled(): boolean {
    return false
  }
}

export default Laos
