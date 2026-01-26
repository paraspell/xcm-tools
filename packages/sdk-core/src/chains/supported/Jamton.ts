// Contains detailed structure of XCM call construction for Jamton Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { findAssetInfoOrThrow, isSymbolMatch } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TPolkadotXCMTransferOptions } from '../../types'
import { assertHasLocation, createAsset } from '../../utils'
import Chain from '../Chain'

class Jamton<TApi, TRes> extends Chain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Jamton', 'jamton', 'Polkadot', Version.V4)
  }

  getCustomCurrencyId(asset: TAssetInfo) {
    const assetId = Number(asset.assetId)
    return asset.isNative ? { Native: assetId } : { ForeignAsset: assetId }
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { assetInfo, scenario, destination, version } = input

    if (assetInfo.isNative) return transferPolkadotXcm(input)

    if (scenario === 'ParaToPara' && destination !== 'AssetHubPolkadot') {
      throw new ScenarioNotSupportedError(
        `Transfer from ${this.chain} to ${JSON.stringify(destination)} is not yet supported`
      )
    }

    if (isSymbolMatch(assetInfo.symbol, 'WUD')) {
      const usdt = findAssetInfoOrThrow(this.chain, { symbol: 'USDt' }, null)
      assertHasLocation(assetInfo)
      assertHasLocation(usdt)
      const MIN_USDT_AMOUNT = 180_000n // 0.18 USDt
      return transferPolkadotXcm({
        ...input,
        overriddenAsset: [
          { ...createAsset(version, MIN_USDT_AMOUNT, usdt.location), isFeeAsset: true },
          createAsset(version, assetInfo.amount, assetInfo.location)
        ]
      })
    }

    return transferPolkadotXcm(input)
  }
}

export default Jamton
