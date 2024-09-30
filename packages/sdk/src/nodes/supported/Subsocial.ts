// Contains detailed structure of XCM call construction for Subsocial Parachain

import { InvalidCurrencyError, ScenarioNotSupportedError } from '../../errors'
import { IPolkadotXCMTransfer, PolkadotXCMTransferInput, Version } from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'

class Subsocial extends ParachainNode implements IPolkadotXCMTransfer {
  constructor() {
    super('Subsocial', 'subsocial', 'polkadot', Version.V3)
  }

  transferPolkadotXCM(input: PolkadotXCMTransferInput) {
    const { scenario, currencySymbol } = input

    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.node, scenario)
    }

    if (currencySymbol !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(
        `Asset ${currencySymbol} is not supported by node ${this.node}.`
      )
    }
    return PolkadotXCMTransferImpl.transferPolkadotXCM(
      input,
      'limitedReserveTransferAssets',
      'Unlimited'
    )
  }
}

export default Subsocial
