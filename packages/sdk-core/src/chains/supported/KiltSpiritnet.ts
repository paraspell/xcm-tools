// Contains detailed structure of XCM call construction for KiltSpiritnet Parachain

import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import Chain from '../Chain'

class KiltSpiritnet<TApi, TRes> extends Chain<TApi, TRes> implements IPolkadotXCMTransfer {
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
        'KiltSpiritnet only supports native asset ParaToPara transfers'
      )
    }

    return transferPolkadotXcm(input)
  }

  isRelayToParaEnabled(): boolean {
    return false
  }
}

export default KiltSpiritnet
