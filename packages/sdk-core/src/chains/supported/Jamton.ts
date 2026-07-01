// Contains detailed structure of XCM call construction for Jamton Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { isSymbolMatch } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TPolkadotXCMTransferOptions } from '../../types'
import { createAsset } from '../../utils'
import SubstrateChain from '../SubstrateChain'

class Jamton<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor() {
    super('Jamton', 'jamton', 'Polkadot', Version.V4)
  }

  getCustomCurrencyId(_api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>, asset: TAssetInfo) {
    const assetId = Number(asset.assetId)
    return asset.isNative ? { Native: assetId } : { ForeignAsset: assetId }
  }

  transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    const { api, assetInfo, scenario, destination, version } = input

    if (assetInfo.isNative) return transferPolkadotXcm(input)

    if (scenario === 'ParaToPara' && destination !== 'AssetHubPolkadot') {
      throw new ScenarioNotSupportedError(
        `Transfer from ${this.chain} to ${JSON.stringify(destination)} is not yet supported`
      )
    }

    if (isSymbolMatch(assetInfo.symbol, 'WUD')) {
      const usdt = api.findAssetInfoOrThrow(this.chain, { symbol: 'USDt' })
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
