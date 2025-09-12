// Contains detailed structure of XCM call construction for the IntegriteePolkadot Parachain

import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { ChainNotSupportedError } from '../../errors'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TSerializedApiCall,
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

  transferRelayToPara(): Promise<TSerializedApiCall> {
    throw new ChainNotSupportedError()
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address } = options

    assertHasId(asset)

    return api.callTxMethod({
      module: 'Assets',
      method: 'transfer',
      parameters: {
        id: Number(asset.assetId),
        target: { Id: address },
        amount: asset.amount
      }
    })
  }
}

export default IntegriteePolkadot
