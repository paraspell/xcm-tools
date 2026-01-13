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
import Parachain from '../Parachain'

class Zeitgeist<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
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

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    return transferPolkadotXcm(input)
  }

  canReceiveFrom(origin: TChain): boolean {
    return origin !== 'Astar'
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address, balance, isAmountAll } = options

    assertHasId(asset)

    const amount = isAmountAll ? balance : asset.amount

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
