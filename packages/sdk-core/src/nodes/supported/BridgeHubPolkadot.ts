// Contains detailed structure of XCM call construction for BridgeHubPolkadot Parachain

import type { TEcosystemType, TNodePolkadotKusama } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { InvalidParameterError, ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TRelayToParaOverrides, TScenario, TSendInternalOptions } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import ParachainNode from '../ParachainNode'

class BridgeHubPolkadot<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IPolkadotXCMTransfer
{
  constructor(
    chain: TNodePolkadotKusama = 'BridgeHubPolkadot',
    info: string = 'polkadotBridgeHub',
    type: TEcosystemType = 'polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, type, version)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario } = input
    if (scenario === 'ParaToPara') {
      throw new ScenarioNotSupportedError(
        this.node,
        scenario,
        'Unable to use bridge hub for transfers to other Parachains. Please move your currency to AssetHub to transfer to other Parachains.'
      )
    }
    const method = 'limited_teleport_assets'
    return transferPolkadotXcm(input, method, 'Unlimited')
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { method: 'limited_teleport_assets', includeFee: true }
  }

  transferLocal(_options: TSendInternalOptions<TApi, TRes>): Promise<TRes> {
    throw new InvalidParameterError(`Local transfers on ${this.chain} are temporarily disabled.`)
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return true
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return true
  }
}

export default BridgeHubPolkadot
