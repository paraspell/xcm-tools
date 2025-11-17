// Contains detailed structure of XCM call construction for Curio Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { isForeignAsset } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TForeignOrTokenAsset, TScenario, TSendInternalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import Parachain from '../Parachain'

class Curio<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Curio', 'curio', 'Kusama', Version.V3)
  }

  getCustomCurrencyId(asset: TAssetInfo): TForeignOrTokenAsset {
    return isForeignAsset(asset) ? { ForeignAsset: Number(asset.assetId) } : { Token: asset.symbol }
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    const currencySelection: TForeignOrTokenAsset = isForeignAsset(asset)
      ? { ForeignAsset: Number(asset.assetId) }
      : { Token: asset.symbol }
    return transferXTokens(input, currencySelection)
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return true
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return true
  }
}

export default Curio
