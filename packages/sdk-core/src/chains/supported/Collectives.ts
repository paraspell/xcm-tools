// Contains detailed structure of XCM call construction for Collectives Parachain

import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type { TRelayToParaOverrides } from '../../types'
import { type IPolkadotXCMTransfer, type TPolkadotXCMTransferOptions } from '../../types'
import Parachain from '../Parachain'

class Collectives<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor(
    chain: TParachain = 'Collectives',
    info: string = 'polkadotCollectives',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { scenario, destination } = input

    const newOverridenAsset = {
      parents: 1,
      interior: {
        Here: null
      }
    }

    input.overriddenAsset = newOverridenAsset

    if (
      scenario === 'ParaToPara' &&
      destination !== 'AssetHubPolkadot' &&
      destination !== 'AssetHubKusama' &&
      destination !== 'AssetHubPaseo' &&
      destination !== 'AssetHubWestend'
    ) {
      throw new ScenarioNotSupportedError(this.chain, scenario)
    }
    return transferPolkadotXcm(input, 'limited_teleport_assets', 'Unlimited')
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { method: 'limited_teleport_assets', includeFee: true }
  }
}

export default Collectives
