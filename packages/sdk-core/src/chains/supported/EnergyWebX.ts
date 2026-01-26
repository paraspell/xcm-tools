// Contains detailed structure of XCM call construction for the EnergyWebX Parachain

import type { TAssetInfo } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import { assertHasLocation } from '../../utils'
import Chain from '../Chain'

class EnergyWebX<TApi, TRes> extends Chain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor(
    chain: TParachain = 'EnergyWebX',
    info: string = 'ewx',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V3
  ) {
    super(chain, info, ecosystem, version)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario } = input

    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError({ chain: this.chain, scenario })
    }

    return transferPolkadotXcm(input, 'reserve_transfer_assets')
  }

  isRelayToParaEnabled(): boolean {
    return false
  }

  async getBalanceForeign<TApi, TRes>(
    api: IPolkadotApi<TApi, TRes>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    assertHasLocation(asset)

    const balance = await api.queryState<{ balance: bigint }>({
      module: 'Assets',
      method: 'Account',
      params: [asset.location, address]
    })

    return balance?.balance ?? 0n
  }
}

export default EnergyWebX
