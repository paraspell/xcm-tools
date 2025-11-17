// Contains detailed structure of XCM call construction for Jamton Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { findAssetInfoOrThrow, isForeignAsset, isSymbolMatch } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferXTokens } from '../../pallets/xTokens'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId, assertHasLocation, createAsset } from '../../utils'
import Parachain from '../Parachain'

class Jamton<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  private static NATIVE_ASSET_IDS: Record<string, number> = {
    DOTON: 0,
    stDOT: 1,
    jamTON: 2
  }

  constructor() {
    super('Jamton', 'jamton', 'Polkadot', Version.V4)
  }

  getCustomCurrencyId(asset: TAssetInfo) {
    return isForeignAsset(asset)
      ? { ForeignAsset: Number(asset.assetId) }
      : { Native: Jamton.NATIVE_ASSET_IDS[asset.symbol] }
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset, scenario, destination, version } = input

    const currencySelection = this.getCustomCurrencyId(asset)

    if (!isForeignAsset(asset) && asset.symbol in Jamton.NATIVE_ASSET_IDS) {
      return transferXTokens(input, currencySelection)
    }

    assertHasId(asset)

    if (scenario === 'ParaToPara' && destination !== 'AssetHubPolkadot') {
      throw new ScenarioNotSupportedError(
        this.chain,
        scenario,
        `Transfer from ${this.chain} to ${JSON.stringify(destination)} is not yet supported`
      )
    }

    if (isSymbolMatch(asset.symbol, 'WUD')) {
      const usdt = findAssetInfoOrThrow(this.chain, { symbol: 'USDt' }, null)
      assertHasLocation(asset)
      assertHasLocation(usdt)
      const MIN_USDT_AMOUNT = 180_000n // 0.18 USDt
      return transferXTokens(
        {
          ...input,
          overriddenAsset: [
            { ...createAsset(version, MIN_USDT_AMOUNT, usdt.location), isFeeAsset: true },
            createAsset(version, asset.amount, asset.location)
          ]
        },
        asset.assetId
      )
    }

    return transferXTokens(input, currencySelection)
  }
}

export default Jamton
