// Contains detailed structure of XCM call construction for Unique Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId, assertHasLocation } from '../../utils'
import Parachain from '../Parachain'

class Unique<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  private static NATIVE_ASSET_ID = 0

  constructor() {
    super('Unique', 'unique', 'Polkadot', Version.V5)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input

    if (asset.symbol === this.getNativeAssetSymbol()) {
      return transferXTokens(input, Unique.NATIVE_ASSET_ID)
    }

    assertHasId(asset)

    return transferXTokens(input, Number(asset.assetId))
  }

  transferLocalNonNativeAsset(_options: TTransferLocalOptions<TApi, TRes>): TRes {
    throw new ScenarioNotSupportedError(
      this.chain,
      'ParaToPara',
      `${this.chain} does not support foreign assets local transfers`
    )
  }

  async getBalanceForeign<TApi, TRes>(
    api: IPolkadotApi<TApi, TRes>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    assertHasLocation(asset)
    assertHasId(asset)

    const collectionId = await api.queryState({
      module: 'ForeignAssets',
      method: 'ForeignAssetToCollection',
      params: [asset.location]
    })

    const balance = await api.queryRuntimeApi<{ success: boolean; value: bigint }>({
      module: 'UniqueApi',
      method: 'balance',
      params: [collectionId, { Substrate: address }, Number(asset.assetId)]
    })

    return balance?.value ?? 0n
  }
}

export default Unique
