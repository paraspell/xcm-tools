// Contains detailed structure of XCM call construction for Moonriver Parachain

import { DOT_MULTILOCATION } from '../../const'
import { InvalidCurrencyError } from '../../errors'
import { createCurrencySpec } from '../../pallets/xcmPallet/utils'
import { constructRelayToParaParameters } from '../../pallets/xcmPallet/constructRelayToParaParameters'
import type {
  IPolkadotXCMTransfer,
  PolkadotXCMTransferInput,
  TAsset,
  TMultiLocation,
  TScenario
} from '../../types'
import { Version, type TSerializedApiCall, type TRelayToParaOptions, Parents } from '../../types'
import { isForeignAsset } from '../../utils/assets'
import { getNodeProviders } from '../config'
import ParachainNode from '../ParachainNode'
import PolkadotXCMTransferImpl from '../polkadotXcm'

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

  transferPolkadotXCM<TApi, TRes>(input: PolkadotXCMTransferInput<TApi, TRes>): Promise<TRes> {
    const { asset, amount, scenario, version = this.version, overridedCurrency } = input
    const multiLocation = this.getJunctions(asset, scenario)
    return Promise.resolve(
      PolkadotXCMTransferImpl.transferPolkadotXCM(
        {
          ...input,
          currencySelection: createCurrencySpec(
            amount,
            version,
            multiLocation.parents as Parents,
            overridedCurrency,
            multiLocation.interior
          )
        },
        'transfer_assets',
        'Unlimited'
      )
    )
  }

  transferRelayToPara(options: TRelayToParaOptions<TApi, TRes>): TSerializedApiCall {
    const { version = Version.V3 } = options
    return {
      module: 'XcmPallet',
      section: 'limited_reserve_transfer_assets',
      parameters: constructRelayToParaParameters(options, version, true)
    }
  }

  getProvider(): string {
    // Return the second WebSocket URL because the first one is sometimes unreliable.
    return getNodeProviders(this.node)[3]
  }
}

export default Moonriver
