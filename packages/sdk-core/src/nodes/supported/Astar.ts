// Contains detailed structure of XCM call construction for Astar Parachain

import {
  Version,
  type IPolkadotXCMTransfer,
  type IXTokensTransfer,
  type TPolkadotXCMTransferOptions,
  type TSendInternalOptions,
  type TXTokensTransferOptions
} from '../../types'
import { isForeignAsset } from '../../utils/assets'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import XTokensTransferImpl from '../../pallets/xTokens'

class Astar<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IPolkadotXCMTransfer, IXTokensTransfer
{
  constructor() {
    super('Astar', 'astar', 'polkadot', Version.V3)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    // TESTED https://polkadot.subscan.io/xcm_message/polkadot-f2b697df74ebe4b62853fe81b8b7d0522464972d
    return Promise.resolve(
      PolkadotXCMTransferImpl.transferPolkadotXCM(input, 'reserve_transfer_assets')
    )
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    if (!isForeignAsset(asset) || !asset.assetId) {
      return XTokensTransferImpl.transferXTokens(input, undefined)
    }

    return XTokensTransferImpl.transferXTokens(input, BigInt(asset.assetId))
  }

  protected canUseXTokens({ asset }: TSendInternalOptions<TApi, TRes>): boolean {
    return asset.symbol !== this.getNativeAssetSymbol()
  }
}

export default Astar
