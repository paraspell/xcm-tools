// Contains detailed structure of XCM call construction for the IntegriteePolkadot Parachain

import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { ChainNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TScenario,
  TSendInternalOptions,
  TSerializedExtrinsics,
  TTransferLocalOptions
} from '../../types'
import { assertHasId } from '../../utils'
import Parachain from '../Parachain'

class IntegriteePolkadot<TApi, TRes> extends Parachain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor(
    chain: TParachain = 'IntegriteePolkadot',
    info: string = 'integritee',
    type: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, type, version)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    return transferPolkadotXcm(input, 'transfer_assets', 'Unlimited')
  }

  transferRelayToPara(): Promise<TSerializedExtrinsics> {
    throw new ChainNotSupportedError()
  }

  isSendingTempDisabled(_options: TSendInternalOptions<TApi, TRes>): boolean {
    return true
  }

  isReceivingTempDisabled(_scenario: TScenario): boolean {
    return true
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address, isAmountAll } = options

    assertHasId(asset)

    const assetId = Number(asset.assetId)
    const dest = { Id: address }

    if (isAmountAll) {
      return api.deserializeExtrinsics({
        module: 'Assets',
        method: 'transfer_all',
        params: {
          id: assetId,
          dest,
          keep_alive: false
        }
      })
    }

    return api.deserializeExtrinsics({
      module: 'Assets',
      method: 'transfer',
      params: {
        id: assetId,
        target: dest,
        amount: asset.amount
      }
    })
  }
}

export default IntegriteePolkadot
