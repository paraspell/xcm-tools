// Contains detailed structure of XCM call construction for Jamton Parachain

import type { TAssetInfo, WithAmount } from '@paraspell/assets'
import { isSymbolMatch } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TMintConfig, TPolkadotXCMTransferOptions } from '../../types'
import { createAsset } from '../../utils'
import SubstrateChain from '../SubstrateChain'

const MIN_USDT_AMOUNT = 180_000n // 0.18 USDt

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

  protected getLocalCurrencyId(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    asset: TAssetInfo
  ) {
    return this.getCustomCurrencyId(api, asset)
  }

  protected getMintConfig(): TMintConfig {
    return { useCustomCurrencyId: true }
  }

  resolveCustomTransferAssets(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    asset: WithAmount<TAssetInfo>
  ): WithAmount<TAssetInfo>[] {
    if (!isSymbolMatch(asset.symbol, 'WUD')) return []

    const usdt = api.findAssetInfoOrThrow(this.chain, { symbol: 'USDt' })
    return [{ ...usdt, amount: MIN_USDT_AMOUNT, isFeeAsset: true }]
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

    const additionalAssets = this.resolveCustomTransferAssets(api, assetInfo)
    if (additionalAssets.length > 0) {
      return transferPolkadotXcm({
        ...input,
        overriddenAsset: [...additionalAssets, assetInfo].map(
          ({ amount, location, isFeeAsset }) => ({
            ...createAsset(version, amount, location),
            ...(isFeeAsset && { isFeeAsset: true })
          })
        )
      })
    }

    return transferPolkadotXcm(input)
  }
}

export default Jamton
