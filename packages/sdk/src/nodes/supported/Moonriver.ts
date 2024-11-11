// Contains detailed structure of XCM call construction for Moonriver Parachain

import { InvalidCurrencyError } from '../../errors'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import type { TAsset } from '../../types'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TSerializedApiCallV2,
  type TRelayToParaOptions,
  type TXcmForeignAsset,
  type TSelfReserveAsset
} from '../../types'
import { getAllNodeProviders } from '../../utils'
import { isForeignAsset } from '../../utils/assets'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Moonriver<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Moonriver', 'moonriver', 'kusama', Version.V3)
  }

  private getCurrencySelection(asset: TAsset): TSelfReserveAsset | TXcmForeignAsset {
    if (asset.symbol === this.getNativeAssetSymbol()) return 'SelfReserve'

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

  transferRelayToPara(options: TRelayToParaOptions<TApi, TRes>): TSerializedApiCallV2 {
    const { version = Version.V3 } = options
    return {
      module: 'XcmPallet',
      section: 'limited_reserve_transfer_assets',
      parameters: constructRelayToParaParameters(options, version, true)
    }
  }

  getProvider(): string {
    // Return the second WebSocket URL because the first one is sometimes unreliable.
    return getAllNodeProviders(this.node)[3]
  }
}

export default Moonriver
