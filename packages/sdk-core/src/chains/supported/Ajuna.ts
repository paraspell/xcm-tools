// Contains detailed structure of XCM call construction for Ajuna Parachain on Polkadot

import { InvalidCurrencyError } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { ChainNotSupportedError, ScenarioNotSupportedError } from '../../errors'
import { transferXTokens } from '../../pallets/xTokens'
import type { TSerializedApiCall, TTransferLocalOptions } from '../../types'
import { type IXTokensTransfer, type TXTokensTransferOptions } from '../../types'
import { assertHasId } from '../../utils'
import Parachain from '../Parachain'

class Ajuna<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  constructor(
    chain: TParachain = 'Ajuna',
    info: string = 'ajuna',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, ecosystem, version)
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { scenario, asset } = input

    if (scenario !== 'ParaToPara') {
      throw new ScenarioNotSupportedError(this.chain, scenario)
    }

    if (asset.symbol !== this.getNativeAssetSymbol()) {
      throw new InvalidCurrencyError(
        `Asset ${asset.symbol} is not supported by chain ${this.chain}.`
      )
    }

    return transferXTokens(input, this.getNativeAssetSymbol())
  }

  transferRelayToPara(): Promise<TSerializedApiCall> {
    throw new ChainNotSupportedError()
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address, isAmountAll } = options

    assertHasId(asset)

    const assetId = Number(asset.assetId)
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

export default Ajuna
