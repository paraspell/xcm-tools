// Contains detailed structure of XCM call construction for Bifrost Parachain on Polkadot

import { createCurrencySpec } from '../../pallets/xcmPallet/utils'
import { getAssetId } from '../../pallets/assets'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TAsset,
  TSendInternalOptions
} from '../../types'
import { type IXTokensTransfer, Parents, Version, type TXTokensTransferOptions } from '../../types'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import XTokensTransferImpl from '../../pallets/xTokens'
import { ETHEREUM_JUNCTION } from '../../constants'
import { isForeignAsset } from '../../utils/assets'

export class BifrostPolkadot<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IXTokensTransfer, IPolkadotXCMTransfer
{
  constructor() {
    super('BifrostPolkadot', 'bifrost', 'polkadot', Version.V3)
  }

  getCurrencySelection(asset: TAsset) {
    const nativeAssetSymbol = this.getNativeAssetSymbol()

    if (asset.symbol === nativeAssetSymbol) {
      return { Native: nativeAssetSymbol }
    }

    const isVToken = asset.symbol && asset.symbol.startsWith('v')
    const isVSToken = asset.symbol && asset.symbol.startsWith('vs')

    if (!isForeignAsset(asset)) {
      return isVToken ? { VToken: asset.symbol.substring(1) } : { Token: asset.symbol }
    }

    const id = Number(asset.assetId)
    if (isVSToken) {
      return { VSToken2: id }
    }

    return isVToken ? { VToken2: id } : { Token2: id }
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    const currencySelection = this.getCurrencySelection(asset)
    return XTokensTransferImpl.transferXTokens(input, currencySelection)
  }

  // Handles DOT, WETH transfers to AssetHubPolkadot
  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { overriddenAsset, asset } = input

    return Promise.resolve(
      PolkadotXCMTransferImpl.transferPolkadotXCM(
        {
          ...input,
          currencySelection: createCurrencySpec(
            asset.amount,
            this.version,
            asset.symbol === 'DOT' ? Parents.ONE : Parents.TWO,
            overriddenAsset,
            asset.symbol === 'WETH'
              ? {
                  X2: [
                    ETHEREUM_JUNCTION,
                    {
                      AccountKey20: { key: getAssetId('Ethereum', 'WETH') ?? '' }
                    }
                  ]
                }
              : undefined
          )
        },
        'transfer_assets',
        'Unlimited'
      )
    )
  }

  protected canUseXTokens({ asset, destination }: TSendInternalOptions<TApi, TRes>): boolean {
    return (asset.symbol !== 'WETH' && asset.symbol !== 'DOT') || destination !== 'AssetHubPolkadot'
  }
}
