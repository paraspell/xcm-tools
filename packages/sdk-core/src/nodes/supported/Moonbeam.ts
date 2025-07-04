// Contains detailed structure of XCM call construction for Moonbeam Parachain

import { InvalidCurrencyError, isForeignAsset, type TAsset } from '@paraspell/assets'
import type { TEcosystemType, TNodePolkadotKusama } from '@paraspell/sdk-common'
import { Parents, type TMultiLocation, Version } from '@paraspell/sdk-common'

import { DOT_MULTILOCATION } from '../../constants'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TRelayToParaOverrides,
  TScenario,
  TTransferLocalOptions
} from '../../types'
import { assertHasLocation } from '../../utils'
import { createMultiAsset } from '../../utils/multiAsset'
import ParachainNode from '../ParachainNode'

class Moonbeam<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor(
    chain: TNodePolkadotKusama = 'Moonbeam',
    info: string = 'moonbeam',
    type: TEcosystemType = 'polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, type, version)
  }

  private getMultiLocation(asset: TAsset, scenario: TScenario): TMultiLocation {
    if (scenario === 'ParaToRelay') return DOT_MULTILOCATION

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

    return asset.multiLocation
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { destination, asset, scenario, version = this.version } = input

    if (destination === 'Ethereum') {
      return this.transferToEthereum(input)
    }

    const multiLocation = this.getMultiLocation(asset, scenario)
    return transferPolkadotXcm(
      {
        ...input,
        multiAsset: createMultiAsset(version, asset.amount, multiLocation)
      },
      'transfer_assets',
      'Unlimited'
    )
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { method: 'limited_reserve_transfer_assets', includeFee: true }
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, asset, address } = options

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} is not a foreign asset`)
    }

    if (asset.assetId === undefined) {
      throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)
    }

    return api.callTxMethod({
      module: 'Assets',
      method: 'transfer',
      parameters: {
        id: BigInt(asset.assetId),
        target: address,
        amount: BigInt(asset.amount)
      }
    })
  }
}

export default Moonbeam
