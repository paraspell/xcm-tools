// Contains detailed structure of XCM call construction for Moonriver Parachain

import { type TAssetInfo } from '@paraspell/assets'
import { Parents, type TLocation, Version } from '@paraspell/sdk-common'

import { DOT_LOCATION } from '../../constants'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TScenario,
  TTransferLocalOptions
} from '../../types'
import { assertHasLocation, getChain } from '../../utils'
import { createAsset } from '../../utils/asset'
import Parachain from '../Parachain'

class Moonriver<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor() {
    super('Moonriver', 'moonriver', 'Kusama', Version.V5)
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

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    const { assetInfo, scenario, version } = input
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

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    return getChain<TApi, TRes, 'Moonbeam'>('Moonbeam').transferLocalNonNativeAsset(options)
  }
}

export default Moonriver
