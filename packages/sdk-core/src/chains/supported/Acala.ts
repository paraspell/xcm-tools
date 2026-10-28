// Contains detailed structure of XCM call construction for Acala Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { InvalidCurrencyError } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TMintConfig,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import { type TForeignOrTokenAsset } from '../../types'
import { getLocalTransferAmount } from '../../utils/transfer'
import SubstrateChain from '../SubstrateChain'

class Acala<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor(
    chain: TParachain = 'Acala',
    info: string = 'acala',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    return transferPolkadotXcm(input)
  }

  isRelayToParaEnabled(): boolean {
    return false
  }

  transferLocalNonNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): TRes {
    const { api, assetInfo: asset, recipient } = options

    if (asset.symbol.toLowerCase() === 'lcdot') {
      throw new ScenarioNotSupportedError('LcDOT local transfers are not supported')
    }

    const amount = getLocalTransferAmount(options)

    return api.deserializeExtrinsics({
      module: 'Currencies',
      method: 'transfer',
      params: {
        dest: { Id: recipient },
        currency_id: this.getCustomCurrencyId(api, asset),
        amount
      }
    })
  }

  getCustomCurrencyId(
    _api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    asset: TAssetInfo
  ): TForeignOrTokenAsset {
    // aSEED is registered as Token(AUSD) on Acala
    const symbol = asset.symbol === 'aSEED' ? 'AUSD' : asset.symbol
    return asset.isNative ? { Token: symbol } : { ForeignAsset: Number(asset.assetId) }
  }

  protected getMintConfig(): TMintConfig {
    return { useCustomCurrencyId: true }
  }

  getBalance(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    if (asset.symbol.toLowerCase() === 'lcdot') {
      throw new InvalidCurrencyError('LcDOT balance is not supported')
    }
    return super.getBalance(api, address, asset)
  }
}

export default Acala
