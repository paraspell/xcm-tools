// Contains detailed structure of XCM call construction for Bifrost Parachain on Polkadot

import {
  findAssetByLocation,
  getOtherAssets,
  getRelayChainSymbol,
  isForeignAsset,
  isSymbolMatch,
  type TAssetInfo
} from '@paraspell/assets'
import type { TEcosystemType, TNodePolkadotKusama } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { transferXTokens } from '../../pallets/xTokens'
import { createTypeAndThenCall } from '../../transfer'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TSendInternalOptions,
  TTransferLocalOptions
} from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { createAsset } from '../../utils/asset'
import ParachainNode from '../ParachainNode'

class BifrostPolkadot<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IXTokensTransfer, IPolkadotXCMTransfer
{
  constructor(
    chain: TNodePolkadotKusama = 'BifrostPolkadot',
    info: string = 'bifrost',
    type: TEcosystemType = 'polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, type, version)
  }

  getCurrencySelection(asset: TAssetInfo) {
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
  async transferToAssetHub<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { api, asset: assetInfo } = input

    if (isSymbolMatch(assetInfo.symbol, getRelayChainSymbol(this.node))) {
      return api.callTxMethod(await createTypeAndThenCall(this.node, input))
    }

    assertHasLocation(assetInfo)

    return transferPolkadotXcm(
      {
        ...input,
        asset: createAsset(this.version, assetInfo.amount, assetInfo.multiLocation)
      },
      'transfer_assets',
      'Unlimited'
    )
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { destination } = input
    if (destination === 'Ethereum') {
      return this.transferToEthereum(input)
    }

    return this.transferToAssetHub(input)
  }

  canUseXTokens({ asset, to: destination }: TSendInternalOptions<TApi, TRes>): boolean {
    const isEthAsset =
      asset.location && findAssetInfoByLoc(getOtherAssets('Ethereum'), asset.location)
    if (isEthAsset) return false
    if (destination === 'Ethereum') return false
    return (asset.symbol !== 'WETH' && asset.symbol !== 'DOT') || destination !== 'AssetHubPolkadot'
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

    return api.callTxMethod({
      module: 'Tokens',
      method: 'transfer',
      parameters: {
        dest: { Id: address },
        currency_id: this.getCurrencySelection(asset),
        amount: asset.amount
      }
    })
  }
}

export default BifrostPolkadot
