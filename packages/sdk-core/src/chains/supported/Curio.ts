// Contains detailed structure of XCM call construction for Curio Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TForeignOrTokenAsset, TScenario, TSendInternalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import Chain from '../Chain'

class Curio<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IXTokensTransfer<TApi, TRes, TSigner>
{
  constructor() {
    super('Curio', 'curio', 'Kusama', Version.V3)
  }

  getCustomCurrencyId(asset: TAssetInfo): TForeignOrTokenAsset {
    return asset.isNative ? { Token: asset.symbol } : { ForeignAsset: Number(asset.assetId) }
  }

  transferXTokens(input: TXTokensTransferOptions<TApi, TRes, TSigner>) {
    const { asset } = input
    const currencySelection: TForeignOrTokenAsset = this.getCustomCurrencyId(asset)
    return transferXTokens(input, currencySelection)
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes, TSigner>): boolean {
    return true
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return true
  }
}

export default Curio
