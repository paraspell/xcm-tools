// Contains detailed structure of XCM call construction for Laos Parachain

import { InvalidCurrencyError } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import {
  ChainNotSupportedError,
  ScenarioNotSupportedError,
  TransferToAhNotSupported
} from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TSerializedExtrinsics
} from '../../types'
import Parachain from '../Parachain'

class Laos<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor(
    chain: TParachain = 'Laos',
    info: string = 'laos',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, ecosystem, version)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario, assetInfo: asset, destination } = input

    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.chain, scenario)
    }

    if (asset.symbol !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(
        `Asset ${asset.symbol} is not supported by chain ${this.chain}.`
      )
    }

    if (destination === 'AssetHubPolkadot') {
      throw new TransferToAhNotSupported('Transfer from Laos to AssetHubPolkadot is not supported.')
    }

    return transferPolkadotXcm(input, 'limited_reserve_transfer_assets', 'Unlimited')
  }

  transferRelayToPara(): Promise<TSerializedExtrinsics> {
    throw new ChainNotSupportedError()
  }
}

export default Laos
