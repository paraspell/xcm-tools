// Contains detailed structure of XCM call construction for Peaq Parachain

import { Version } from '@paraspell/sdk-common'

import { ChainNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferXTokens } from '../../pallets/xTokens'
import type { TScenario, TSendInternalOptions, TTransferLocalOptions } from '../../types'
import {
  type IXTokensTransfer,
  type TSerializedApiCall,
  type TXTokensTransferOptions
} from '../../types'
import { assertHasId } from '../../utils'
import Parachain from '../Parachain'

class Peaq<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  constructor() {
    super('Peaq', 'peaq', 'Polkadot', Version.V4)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { scenario, asset } = input
    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.chain, scenario)
    }

    assertHasId(asset)

    return transferXTokens(input, BigInt(asset.assetId))
  }

  transferRelayToPara(): Promise<TSerializedApiCall> {
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

    const assetId = BigInt(asset.assetId)
    const dest = { Id: address }

    if (isAmountAll) {
      return api.callTxMethod({
        module: 'Assets',
        method: 'transfer_all',
        parameters: {
          id: assetId,
          dest,
          keep_alive: false
        }
      })
    }

    return api.callTxMethod({
      module: 'Assets',
      method: 'transfer',
      parameters: {
        id: assetId,
        target: dest,
        amount: asset.amount
      }
    })
  }
}

export default Peaq
