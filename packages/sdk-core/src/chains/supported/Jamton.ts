// Contains detailed structure of XCM call construction for Jamton Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { replaceBigInt, Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { IPolkadotXCMTransfer, TMintConfig, TPolkadotXCMTransferOptions } from '../../types'
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

  protected getLocalCurrencyId(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    asset: TAssetInfo
  ) {
    return this.getCustomCurrencyId(api, asset)
  }

  protected getMintConfig(): TMintConfig {
    return { useCustomCurrencyId: true }
  }

  transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    const { assetInfo, scenario, destination } = input

    if (assetInfo.isNative) return transferPolkadotXcm(input)

    if (scenario === 'ParaToPara' && destination !== 'AssetHubPolkadot') {
      throw new ScenarioNotSupportedError(
        `Transfer from ${this.chain} to ${JSON.stringify(destination, replaceBigInt)} is not yet supported`
      )
    }

    return transferPolkadotXcm(input)
  }
}

export default Jamton
