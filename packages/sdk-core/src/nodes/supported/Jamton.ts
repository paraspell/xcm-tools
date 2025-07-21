// Contains detailed structure of XCM call construction for Jamton Parachain

import { findAssetForNodeOrThrow, isForeignAsset, isSymbolMatch } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferXTokens } from '../../pallets/xTokens'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId, assertHasLocation, createMultiAsset } from '../../utils'
import ParachainNode from '../ParachainNode'

class Jamton<TApi, TRes> extends ParachainNode<TApi, TRes> implements IXTokensTransfer {
  private static NATIVE_ASSET_IDS: Record<string, number> = {
    DOTON: 0,
    stDOT: 1,
    jamTON: 2
  }

  constructor() {
    super('Jamton', 'jamton', 'polkadot', Version.V4)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset, scenario, destination, version } = input

    if (!isForeignAsset(asset) && asset.symbol in Jamton.NATIVE_ASSET_IDS) {
      return transferXTokens(input, { Native: Jamton.NATIVE_ASSET_IDS[asset.symbol] })
    }

    assertHasId(asset)

    if (scenario === 'ParaToPara' && destination !== 'AssetHubPolkadot') {
      throw new ScenarioNotSupportedError(
        this.node,
        scenario,
        `Transfer from ${this.node} to ${JSON.stringify(destination)} is not yet supported`
      )
    }

    if (isSymbolMatch(asset.symbol, 'WUD')) {
      const usdt = findAssetForNodeOrThrow(this.node, { symbol: 'USDt' }, null)
      assertHasLocation(asset)
      assertHasLocation(usdt)
      const MIN_USDT_AMOUNT = 180_000n // 0.18 USDt
      return transferXTokens(
        {
          ...input,
          overriddenAsset: [
            { ...createMultiAsset(version, MIN_USDT_AMOUNT, usdt.multiLocation), isFeeAsset: true },
            createMultiAsset(version, asset.amount, asset.multiLocation)
          ]
        },
        asset.assetId
      )
    }

    return transferXTokens(input, { ForeignAsset: Number(asset.assetId) })
  }
}

export default Jamton
