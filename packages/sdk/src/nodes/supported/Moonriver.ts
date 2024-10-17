// Contains detailed structure of XCM call construction for Moonriver Parachain

import { constructRelayToParaParameters } from '../../pallets/xcmPallet/utils'
import type { TNodePolkadotKusama } from '../../types'
import {
  type IXTokensTransfer,
  Version,
  type XTokensTransferInput,
  type TSerializedApiCallV2,
  type TRelayToParaOptions,
  type TForeignAsset,
  type TSelfReserveAsset
} from '../../types'
import { getAllNodeProviders } from '../../utils'
import ParachainNode from '../ParachainNode'
import XTokensTransferImpl from '../xTokens'

class Moonriver<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Moonriver', 'moonriver', 'kusama', Version.V3)
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
    // Return the second WebSocket URL because the first one is sometimes unreliable.
    return getAllNodeProviders(this.node as TNodePolkadotKusama)[3]
  }
}

export default Moonriver
