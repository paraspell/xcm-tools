// Contains detailed structure of XCM call construction for Zeitgeist Parachain

import { type TAssetInfo } from '@paraspell/assets'
import type { TChain, TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import { type TXcmForeignAsset, type TZeitgeistAsset } from '../../types'
import { assertHasId } from '../../utils'
import { getLocalTransferAmount } from '../../utils/transfer'
import Chain from '../Chain'

class Zeitgeist<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor(
    chain: TParachain = 'Zeitgeist',
    info: string = 'zeitgeist',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, ecosystem, version)
  }

  getCustomCurrencyId(asset: TAssetInfo): TZeitgeistAsset | TXcmForeignAsset {
    if (asset.isNative) return 'Ztg'
    assertHasId(asset)
    return { ForeignAsset: Number(asset.assetId) }
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    return transferPolkadotXcm(input)
  }

  canReceiveFrom(origin: TChain): boolean {
    return origin !== 'Astar'
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    const { api, assetInfo: asset, address } = options

    assertHasId(asset)

    const amount = getLocalTransferAmount(options)

    return api.deserializeExtrinsics({
      module: 'AssetManager',
      method: 'transfer',
      params: {
        dest: { Id: address },
        currency_id: this.getCustomCurrencyId(asset),
        amount
      }
    })
  }
}

export default Zeitgeist
