// Contains detailed structure of XCM call construction for Moonbeam Parachain

import { getRelayChainSymbol, isSymbolMatch, type TAssetInfo } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Parents, type TLocation, Version } from '@paraspell/sdk-common'

import { DOT_LOCATION } from '../../constants'
import { ScenarioNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { createTypeAndThenCall } from '../../transfer'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TScenario,
  TTransferLocalOptions
} from '../../types'
import { assertHasLocation, localizeLocation } from '../../utils'
import { createAsset } from '../../utils/asset'
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

  private getLocation(asset: TAssetInfo, scenario: TScenario): TLocation {
    if (scenario === 'ParaToRelay') return DOT_LOCATION

    if (asset.symbol === this.getNativeAssetSymbol())
      return {
        parents: Parents.ZERO,
        interior: {
          X1: {
            PalletInstance: 10
          }
        }
      }

    assertHasLocation(asset)

    return asset.location
  }

  async transferPolkadotXCM<TApi, TRes>(
    input: TPolkadotXCMTransferOptions<TApi, TRes>
  ): Promise<TRes> {
    const { api, destination, assetInfo, scenario, version } = input

    if (destination === 'Ethereum') {
      return this.transferToEthereum(input)
    }

    if (isSymbolMatch(assetInfo.symbol, getRelayChainSymbol(this.chain))) {
      return api.callTxMethod(await createTypeAndThenCall(this.chain, input))
    }

    const location = this.getLocation(assetInfo, scenario)

    return transferPolkadotXcm(
      {
        ...input,
        asset: createAsset(version, assetInfo.amount, localizeLocation(this.chain, location))
      },
      'transfer_assets',
      'Unlimited'
    )
  }

  transferLocalNonNativeAsset(_options: TTransferLocalOptions<TApi, TRes>): TRes {
    throw new ScenarioNotSupportedError(
      this.chain,
      'ParaToPara',
      `${this.chain} local transfers are temporarily disabled`
    )
  }
}

export default Moonbeam
