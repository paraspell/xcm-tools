// Contains detailed structure of XCM call construction for Subsocial Parachain

import { InvalidCurrencyError, ScenarioNotSupportedError } from '../../errors'
import type { IPolkadotXCMTransfer, PolkadotXCMTransferInput, TTransferReturn } from '../../types'
import { Version } from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'

class Subsocial<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Subsocial', 'subsocial', 'polkadot', Version.V3)
  }

  transferPolkadotXCM<TApi, TRes>(
    input: PolkadotXCMTransferInput<TApi, TRes>
  ): Promise<TTransferReturn<TRes>> {
    const { scenario, currencySymbol } = input

    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }

    if (currencySymbol !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(
        `Asset ${currencySymbol} is not supported by node ${this.node}.`
      )
    }
    return Promise.resolve(
      PolkadotXCMTransferImpl.transferPolkadotXCM(
        input,
        'limited_reserve_transfer_assets',
        'Unlimited'
      )
    )
  }
}

export default Subsocial
