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
import Chain from '../Chain'

class Moonbeam<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor(
    chain: TParachain = 'Moonbeam',
    info: string = 'moonbeam',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  async transferPolkadotXCM(
    options: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>
  ): Promise<TRes> {
    const { destination } = options

    if (destination === 'Ethereum') {
      return this.transferToEthereum(options)
    }

    return transferPolkadotXcm(options)
  }

  transferLocalNonNativeAsset(_options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    throw new ScenarioNotSupportedError(
      `${this.chain} local transfers are supported only from EVM Builder`
    )
  }

  getBalanceForeign<TApi, TRes, TSigner>(
    _api: IPolkadotApi<TApi, TRes, TSigner>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    assertHasId(asset)
    return getMoonbeamErc20Balance(this.chain, asset.assetId, address)
  }
}

export default Moonbeam
