// Contains detailed structure of XCM call construction for Subsocial Parachain

import { InvalidCurrencyError } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TScenario,
  TSendInternalOptions
} from '../../types'
import Parachain from '../Parachain'

class Subsocial<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Subsocial', 'subsocial', 'Polkadot', Version.V3)
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

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return true
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return true
  }
}

export default Subsocial
