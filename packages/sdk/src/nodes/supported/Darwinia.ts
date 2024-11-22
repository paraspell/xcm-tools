// Contains detailed structure of XCM call construction for Darwinia Parachain

import type { TAsset } from '../../types'
import {
  Version,
  type TSerializedApiCall,
  type IXTokensTransfer,
  type XTokensTransferInput,
  type TScenario,
  Parents,
  type TSelfReserveAsset,
  type TXcmForeignAsset
} from '../../types'
import ParachainNode from '../ParachainNode'
import { InvalidCurrencyError, NodeNotSupportedError } from '../../errors'
import XTokensTransferImpl from '../xTokens'
import { createCurrencySpec } from '../../pallets/xcmPallet/utils'
import { type TMultiLocation } from '../../types/TMultiLocation'
import { isForeignAsset } from '../../utils/assets'
import { getNodeProviders } from '../config'

class Darwinia<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Darwinia', 'darwinia', 'polkadot', Version.V3)
  }

  private getCurrencySelection(asset: TAsset): TSelfReserveAsset | TXcmForeignAsset {
    if (asset.symbol === this.getNativeAssetSymbol()) {
      return 'SelfReserve'
    }

    if (!isForeignAsset(asset) || !asset.assetId) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return { ForeignAsset: BigInt(asset.assetId) }
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { asset } = input
    const currencySelection = this.getCurrencySelection(asset)
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }

  transferRelayToPara(): TSerializedApiCall {
    throw new NodeNotSupportedError()
  }

  createCurrencySpec(
    amount: string,
    scenario: TScenario,
    version: Version,
    _asset?: TAsset,
    overridedMultiLocation?: TMultiLocation
  ) {
    if (scenario === 'ParaToPara') {
      const interior = {
        X1: {
          PalletInstance: 5
        }
      }
      return createCurrencySpec(amount, version, Parents.ZERO, overridedMultiLocation, interior)
    } else {
      return super.createCurrencySpec(amount, scenario, version, undefined, overridedMultiLocation)
    }
  }

  getProvider(): string {
    // Return the second WebSocket URL because the first one is sometimes unreliable.
    return getNodeProviders(this.node)[2]
  }
}

export default Darwinia
