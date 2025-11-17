// Contains detailed structure of XCM call construction for Manta Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { transferXTokens } from '../../pallets/xTokens'
import type { TScenario, TSendInternalOptions, TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TMantaAsset, type TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import Parachain from '../Parachain'

class Manta<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  static readonly NATIVE_ASSET_ID = 1n

  constructor() {
    super('Manta', 'manta', 'Polkadot', Version.V3)
  }

  private getAssetId(asset: TAssetInfo) {
    if (asset.symbol === this.getNativeAssetSymbol()) return Manta.NATIVE_ASSET_ID

    assertHasId(asset)

    return BigInt(asset.assetId)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    const currencySelection: TMantaAsset = {
      MantaCurrency: this.getAssetId(asset)
    }

    return transferXTokens(input, currencySelection)
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return true
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return true
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address, balance, isAmountAll } = options

    assertHasId(asset)

    const assetId = BigInt(asset.assetId)

    const amount = isAmountAll ? balance : asset.amount

    return api.deserializeExtrinsics({
      module: 'Assets',
      method: 'transfer',
      params: {
        id: assetId,
        target: { Id: address },
        amount
      }
    })
  }
}

export default Manta
