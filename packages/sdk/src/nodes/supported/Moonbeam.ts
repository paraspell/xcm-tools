// Contains detailed structure of XCM call construction for Moonbeam Parachain

import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import type { TSerializedApiCallV2 } from '../../types'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TRelayToParaOptions,
  type TNodePolkadotKusama,
  type TSelfReserveAsset,
  type TForeignAsset
} from '../../types'
import { getAllNodeProviders } from '../../utils'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Moonbeam<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Moonbeam', 'moonbeam', 'polkadot', Version.V3)
  }

  transferXTokens<TApi, TRes>(input: XTokensTransferInput<TApi, TRes>) {
    const { currency, currencyID } = input
    const currencySelection: TSelfReserveAsset | TForeignAsset =
      currency === this.getNativeAssetSymbol()
        ? 'SelfReserve'
        : { ForeignAsset: currencyID ? BigInt(currencyID) : undefined }
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
