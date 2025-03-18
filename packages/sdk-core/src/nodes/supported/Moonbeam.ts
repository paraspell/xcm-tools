// Contains detailed structure of XCM call construction for Moonbeam Parachain

import { InvalidCurrencyError, type TAsset } from '@paraspell/assets'
import { Parents, type TMultiLocation } from '@paraspell/sdk-common'

import { DOT_MULTILOCATION } from '../../constants'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import { createVersionedMultiAssets } from '../../pallets/xcmPallet/utils'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TRelayToParaOverrides,
  TScenario
} from '../../types'
import { Version } from '../../types'
import ParachainNode from '../ParachainNode'

class Moonbeam<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Moonbeam', 'moonbeam', 'polkadot', Version.V3)
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

    if (!asset.multiLocation) {
      throw new InvalidCurrencyError(
        'throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)'
      )
    }

    return asset.multiLocation
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { asset, scenario, version = this.version } = input
    const multiLocation = this.getMultiLocation(asset, scenario)
    return Promise.resolve(
      PolkadotXCMTransferImpl.transferPolkadotXCM(
        {
          ...input,
          currencySelection: createVersionedMultiAssets(version, asset.amount, multiLocation)
        },
        'transfer_assets',
        'Unlimited'
      )
    )
  }

  getRelayToParaOverrides(): TRelayToParaOverrides {
    return { section: 'limited_reserve_transfer_assets', includeFee: true }
  }
}

export default Moonbeam
