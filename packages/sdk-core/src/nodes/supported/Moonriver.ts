// Contains detailed structure of XCM call construction for Moonriver Parachain

import { InvalidCurrencyError, type TAsset } from '@paraspell/assets'
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
import { getNode } from '../../utils'
import { createMultiAsset } from '../../utils/multiAsset'
import ParachainNode from '../ParachainNode'

class Moonriver<TApi, TRes> extends ParachainNode<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Moonriver', 'moonriver', 'kusama', Version.V4)
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
        'throw new InvalidCurrencyError(`Asset ${JSON.stringify(asset)} has no multiLocation`)'
      )
    }

    return asset.multiLocation
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { asset, scenario, version = this.version } = input
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
    return getNode<TApi, TRes, 'Moonbeam'>('Moonbeam').transferLocalNonNativeAsset(options)
  }
}

export default Moonriver
