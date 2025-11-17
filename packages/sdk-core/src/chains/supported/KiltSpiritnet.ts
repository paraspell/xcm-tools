// Contains detailed structure of XCM call construction for KiltSpiritnet Parachain

import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { ChainNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import {
  type IPolkadotXCMTransfer,
  type TPolkadotXCMTransferOptions,
  type TSerializedExtrinsics
} from '../../types'
import Parachain from '../Parachain'

class KiltSpiritnet<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor(
    chain: TParachain = 'KiltSpiritnet',
    info: string = 'kilt',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, ecosystem, version)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario, assetInfo: asset } = input

    if (scenario === 'ParaToPara' && asset.symbol !== this.getNativeAssetSymbol()) {
      throw new ScenarioNotSupportedError(
        this.chain,
        scenario,
        'KiltSpiritnet only supports native asset ParaToPara transfers'
      )
    }

    return transferPolkadotXcm(input, 'limited_reserve_transfer_assets', 'Unlimited')
  }

  transferRelayToPara(): Promise<TSerializedExtrinsics> {
    throw new ChainNotSupportedError()
  }
}

export default KiltSpiritnet
