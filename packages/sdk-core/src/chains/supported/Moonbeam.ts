// Contains detailed structure of XCM call construction for Moonbeam Parachain

import { getRelayChainSymbol, isSymbolMatch, type TAssetInfo } from '@paraspell/assets'
import type { TEcosystemType, TParachain } from '@paraspell/sdk-common'
import { Parents, type TLocation, Version } from '@paraspell/sdk-common'

import { DOT_LOCATION } from '../../constants'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import { createTypeAndThenCall } from '../../transfer'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TRelayToParaOverrides,
  TScenario,
  TTransferLocalOptions
} from '../../types'
import { assertHasId, assertHasLocation } from '../../utils'
import { createAsset } from '../../utils/asset'
import Parachain from '../Parachain'

class Moonbeam<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor(
    chain: TParachain = 'Moonbeam',
    info: string = 'moonbeam',
    type: TEcosystemType = 'polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, type, version)
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
        asset: createAsset(version, assetInfo.amount, location)
      },
      'transfer_assets',
      'Unlimited'
    )
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { method: 'limited_reserve_transfer_assets', includeFee: true }
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo, address } = options

    assertHasId(assetInfo)

    return api.callTxMethod({
      module: 'Assets',
      method: 'transfer',
      parameters: {
        id: BigInt(assetInfo.assetId),
        target: address,
        amount: assetInfo.amount
      }
    })
  }
}

export default Moonbeam
