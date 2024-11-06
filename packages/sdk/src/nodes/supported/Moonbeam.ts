// Contains detailed structure of XCM call construction for Moonbeam Parachain

import { InvalidCurrencyError } from '../../errors'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import type { TAsset, TSerializedApiCallV2 } from '../../types'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TRelayToParaOptions,
  type TNodePolkadotKusama,
  type TSelfReserveAsset,
  type TXcmForeignAsset
} from '../../types'
import { getAllNodeProviders } from '../../utils'
import { isForeignAsset } from '../../utils/assets'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Moonbeam<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Moonbeam', 'moonbeam', 'polkadot', Version.V3)
  }

  private getCurrencySelection(asset: TAsset): TSelfReserveAsset | TXcmForeignAsset {
    if (asset.symbol === this.getNativeAssetSymbol()) return 'SelfReserve'

    if (!isForeignAsset(asset)) {
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
    return getAllNodeProviders(this.node as TNodePolkadotKusama)[2]
  }
}

export default Moonbeam
