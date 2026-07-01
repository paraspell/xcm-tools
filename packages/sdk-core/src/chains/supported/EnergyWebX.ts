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
  type TPolkadotXCMTransferOptions
} from '../../types'
import SubstrateChain from '../SubstrateChain'

class EnergyWebX<TApi, TRes, TSigner>
  extends SubstrateChain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor(
    chain: TParachain = 'EnergyWebX',
    info: string = 'ewx',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    const { scenario } = input

    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError({ chain: this.chain, scenario })
    }

    return transferPolkadotXcm(input)
  }

  isRelayToParaEnabled(): boolean {
    return false
  }

  protected getMintConfig(): TMintConfig {
    return { useLocationId: true }
  }

  async getBalanceForeign<TApi, TRes, TSigner>(
    api: PolkadotApi<TApi, TRes, TSigner>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    const balance = await api.queryState<{ balance: bigint }>({
      module: 'Assets',
      method: 'Account',
      params: [asset.location, address]
    })

    return balance?.balance ?? 0n
  }
}

export default EnergyWebX
