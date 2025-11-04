// Contains detailed structure of XCM call construction for CoretimePolkadot Parachain

import type { TEcosystemType, TNodePolkadotKusama } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { InvalidParameterError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TRelayToParaOverrides, TScenario, TSendInternalOptions } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import ParachainNode from '../ParachainNode'

class CoretimePolkadot<TApi, TRes>
  extends ParachainNode<TApi, TRes>
  implements IPolkadotXCMTransfer
{
  constructor(
    chain: TNodePolkadotKusama = 'CoretimePolkadot',
    info: string = 'polkadotCoretime',
    type: TEcosystemType = 'polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, type, version)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario } = input
    const method =
      scenario === 'ParaToPara' ? 'limited_reserve_transfer_assets' : 'limited_teleport_assets'
    return transferPolkadotXcm(input, method, 'Unlimited')
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { method: 'limited_teleport_assets', includeFee: true }
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return true
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return true
  }

  transferLocal(_options: TSendInternalOptions<TApi, TRes>): TRes {
    throw new InvalidParameterError(`Local transfers on ${this.node} are temporarily disabled.`)
  }
}

export default CoretimePolkadot
