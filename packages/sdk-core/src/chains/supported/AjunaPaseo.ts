import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { ChainNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TSerializedExtrinsics
} from '../../types'
import Parachain from '../Parachain'

class AjunaPaseo<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('AjunaPaseo', 'Ajuna(paseo)', 'Paseo', Version.V4)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario, assetInfo: asset } = input

    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.chain, scenario)
    }

    if (asset.symbol !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(
        `Asset ${asset.symbol} is not supported by chain ${this.chain}.`
      )
    }

    return transferPolkadotXcm(input, 'limited_reserve_transfer_assets', 'Unlimited')
  }

  transferRelayToPara(): Promise<TSerializedExtrinsics> {
    throw new ChainNotSupportedError()
  }
}

export default AjunaPaseo
