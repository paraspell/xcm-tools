// Contains detailed structure of XCM call construction for Moonriver Parachain

import { DOT_MULTILOCATION } from '../../constants'
import { InvalidCurrencyError } from '../../errors'
import PolkadotXCMTransferImpl from '../../pallets/polkadotXcm'
import { createCurrencySpec } from '../../pallets/xcmPallet/utils'
import type {
  IPolkadotXCMTransfer,
  TAsset,
  TMultiLocation,
  TPolkadotXCMTransferOptions,
  TRelayToParaOverrides,
  TScenario
} from '../../types'
import { Parents, Version } from '../../types'
import { isForeignAsset } from '../../utils/assets'
import ParachainNode from '../ParachainNode'

class Moonriver<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Moonriver', 'moonriver', 'kusama', Version.V3)
  }

  private getJunctions(asset: TAsset, scenario: TScenario): TMultiLocation {
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

    if (!isForeignAsset(asset)) {
      throw new InvalidCurrencyError(
        'throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no assetId`)'
      )
    }

    return asset.multiLocation as TMultiLocation
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { asset, scenario, version = this.version, overriddenAsset } = input
    const multiLocation = this.getJunctions(asset, scenario)
    return Promise.resolve(
      PolkadotXCMTransferImpl.transferPolkadotXCM(
        {
          ...input,
          currencySelection: createCurrencySpec(
            asset.amount,
            version,
            multiLocation.parents as Parents,
            overriddenAsset,
            multiLocation.interior
          )
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

export default Moonriver
