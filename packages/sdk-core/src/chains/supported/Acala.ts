// Contains detailed structure of XCM call construction for Acala Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import { MIN_AMOUNT } from '../../constants'
import { transferXTokens } from '../../pallets/xTokens'
import type { TTransferLocalOptions } from '../../types'
import {
  type IXTokensTransfer,
  type TForeignOrTokenAsset,
  type TXTokensTransferOptions
} from '../../types'
import { assertSenderAddress } from '../../utils'
import Parachain from '../Parachain'

class Acala<TApi, TRes> extends Parachain<TApi, TRes> implements IXTokensTransfer {
  constructor(
    chain: TParachain = 'Acala',
    info: string = 'acala',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V4
  ) {
    super(chain, info, ecosystem, version)
  }

  getCurrencySelection(asset: TAssetInfo): TForeignOrTokenAsset {
    const symbol = asset.symbol === 'aSEED' ? 'AUSD' : asset.symbol
    return isForeignAsset(asset) ? { ForeignAsset: Number(asset.assetId) } : { Token: symbol }
  }

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    const currencySelection = this.getCurrencySelection(asset)
    return transferXTokens(input, currencySelection)
  }

  async transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes>): Promise<TRes> {
    const { api, assetInfo: asset, address, balance, senderAddress, isAmountAll } = options

    const createTx = (amount: bigint) =>
      api.callTxMethod({
        module: 'Currencies',
        method: 'transfer_native_currency',
        parameters: {
          dest: { Id: address },
          amount
        }
      })

    let amount: bigint

    if (isAmountAll) {
      assertSenderAddress(senderAddress)
      const fee = await api.calculateTransactionFee(createTx(MIN_AMOUNT), senderAddress)
      amount = balance - fee
    } else {
      amount = asset.amount
    }

    return createTx(amount)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes>): TRes {
    const { api, assetInfo: asset, address, balance, isAmountAll } = options

    if (asset.symbol.toLowerCase() === 'lcdot') {
      throw new InvalidCurrencyError('LcDOT local transfers are not supported')
    }

    const amount = isAmountAll ? balance : asset.amount

    return api.callTxMethod({
      module: 'Currencies',
      method: 'transfer',
      parameters: {
        dest: { Id: address },
        currency_id: this.getCurrencySelection(asset),
        amount
      }
    })
  }
}

export default Acala
