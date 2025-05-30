// Contains detailed structure of XCM call construction for Bifrost Parachain on Polkadot

import {
  findAssetByMultiLocation,
  getAssetId,
  getOtherAssets,
  isForeignAsset,
  type TAsset
} from '@paraspell/assets'
import { Parents } from '@paraspell/sdk-common'

import { ETHEREUM_JUNCTION } from '../../constants'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import { createVersionedMultiAssets } from '../../pallets/xcmPallet/utils'
import { transferXTokens } from '../../pallets/xTokens'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TTransferLocalOptions
} from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions, Version } from '../../types'
import ParachainNode from '../ParachainNode'

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
    return transferXTokens(input, currencySelection)
  }

  // Handles DOT, WETH transfers to AssetHubPolkadot
  transferToAssetHub<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { asset } = input

    return Promise.resolve(
      PolkadotXCMTransferImpl.transferPolkadotXCM(
        {
          ...input,
          currencySelection: createVersionedMultiAssets(this.version, asset.amount, {
            parents: asset.symbol === 'DOT' ? Parents.ONE : Parents.TWO,
            interior:
              asset.symbol === 'WETH'
                ? {
                    X2: [
                      ETHEREUM_JUNCTION,
                      {
                        AccountKey20: { key: getAssetId('Ethereum', 'WETH') ?? '' }
                      }
                    ]
                  }
                : 'Here'
          })
        },
        'transfer_assets',
        'Unlimited'
      )
    )
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { destination } = input
    if (destination === 'Ethereum') {
      return this.transferToEthereum(input)
    }

    return this.transferToAssetHub(input)
  }

  protected canUseXTokens({ asset, to: destination }: TSendInternalOptions<TApi, TRes>): boolean {
    const isEthAsset =
      asset.multiLocation &&
      findAssetByMultiLocation(getOtherAssets('Ethereum'), asset.multiLocation)
    if (isEthAsset) return false
    if (destination === 'Ethereum') return false
    return (asset.symbol !== 'WETH' && asset.symbol !== 'DOT') || destination !== 'AssetHubPolkadot'
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

    return api.callTxMethod({
      module: 'Tokens',
      section: 'transfer',
      parameters: {
        dest: { Id: address },
        currency_id: this.getCurrencySelection(asset),
        amount: BigInt(asset.amount)
      }
    })
  }
}
