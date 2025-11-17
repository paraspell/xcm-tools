// Contains detailed structure of XCM call construction for Moonbeam Parachain

import type { TAssetInfo } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { getMoonbeamErc20Balance } from '../../balance'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import { assertHasId } from '../../utils'
import Parachain from '../Parachain'

class Moonbeam<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor(
    chain: TParachain = 'Moonbeam',
    info: string = 'moonbeam',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  async transferPolkadotXCM<TApi, TRes>(
    options: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { destination } = options

    if (destination === 'Ethereum') {
      return this.transferToEthereum(options)
    }

    return transferPolkadotXcm(options, 'transfer_assets', 'Unlimited')
  }

  transferLocalNonNativeAsset(_options: TTransferLocalOptions<TApi, TRes>): TRes {
    throw new ScenarioNotSupportedError(
      this.chain,
      'ParaToPara',
      `${this.chain} local transfers are temporarily disabled`
    )
  }

  getBalanceForeign<TApi, TRes>(
    _api: IPolkadotApi<TApi, TRes>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    assertHasId(asset)
    return getMoonbeamErc20Balance(this.chain, asset.assetId, address)
  }
}

export default Moonbeam
