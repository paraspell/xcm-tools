// Contains detailed structure of XCM call construction for the EnergyWebX Parachain

import type { TAssetInfo } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import type { PolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import {
  type IPolkadotXCMTransfer,
  type TMintConfig,
  type TPolkadotXCMTransferOptions,
  type TTransferLocalOptions
} from '../../types'
import SubstrateChain from '../SubstrateChain'

class EnergyWebX<TApi, TRes, TSigner, TCustomChain extends string = never>
  extends SubstrateChain<TApi, TRes, TSigner, TCustomChain>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner, TCustomChain>
{
  constructor(
    chain: TParachain = 'EnergyWebX',
    info: string = 'ewx',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  transferPolkadotXCM(
    input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner, TCustomChain>
  ): Promise<TRes> {
    const { scenario } = input

    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError({ chain: this.chain, scenario })
    }

    // EnergyWebX has to stay on reserve_transfer_assets for now.
    // limited_reserve_transfer_assets causes 'Extrinsic is now allowed error'
    return transferPolkadotXcm(input, 'reserve_transfer_assets')
  }

  isRelayToParaEnabled(): boolean {
    return false
  }

  protected shouldUseReserveTransfer(): boolean {
    return true
  }

  protected getMintConfig(): TMintConfig {
    return { useLocationId: true }
  }

  transferLocalNonNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner, TCustomChain>
  ): TRes {
    const { api, assetInfo: asset, recipient, isAmountAll, keepAlive } = options

    const id = api.localizeLocation(this.chain, asset.location)
    const dest = { Id: recipient }

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'Assets',
        method: 'transfer_all',
        params: {
          id,
          dest,
          keep_alive: keepAlive
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'Assets',
      method: keepAlive ? 'transfer_keep_alive' : 'transfer',
      params: {
        id,
        target: dest,
        amount: asset.amount
      }
    })
  }

  async getBalanceForeign(
    api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    const balance = await api.queryState<{ balance: bigint }>({
      module: 'Assets',
      method: 'Account',
      params: [api.localizeLocation(this.chain, asset.location), address]
    })

    return balance?.balance ?? 0n
  }
}

export default EnergyWebX
