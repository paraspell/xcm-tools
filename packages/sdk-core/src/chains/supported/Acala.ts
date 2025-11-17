// Contains detailed structure of XCM call construction for Acala Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { InvalidCurrencyError, isForeignAsset } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { MIN_AMOUNT } from '../../constants'
import { ChainNotSupportedError } from '../../errors'
import { transferXTokens } from '../../pallets/xTokens'
import type { TSerializedExtrinsics, TTransferLocalOptions } from '../../types'
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

  transferXTokens<TApi, TRes>(input: TXTokensTransferOptions<TApi, TRes>) {
    const { asset } = input
    const currencySelection = this.getCustomCurrencyId(asset)
    return transferXTokens(input, currencySelection)
  }

  transferRelayToPara(): Promise<TSerializedExtrinsics> {
    throw new ChainNotSupportedError()
  }

  async transferLocalNativeAsset(options: TTransferLocalOptions<TApi, TRes>): Promise<TRes> {
    const { api, assetInfo: asset, address, balance, senderAddress, isAmountAll } = options

    const createTx = (amount: bigint) =>
      api.deserializeExtrinsics({
        module: 'Currencies',
        method: 'transfer_native_currency',
        params: {
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

    return api.deserializeExtrinsics({
      module: 'Currencies',
      method: 'transfer',
      params: {
        dest: { Id: address },
        currency_id: this.getCustomCurrencyId(asset),
        amount
      }
    })
  }

  getCustomCurrencyId(asset: TAssetInfo): TForeignOrTokenAsset {
    const symbol = asset.symbol === 'aSEED' ? 'AUSD' : asset.symbol
    return isForeignAsset(asset) ? { ForeignAsset: Number(asset.assetId) } : { Token: symbol }
  }

  getBalance(api: IPolkadotApi<TApi, TRes>, address: string, asset: TAssetInfo): Promise<bigint> {
    if (asset.symbol.toLowerCase() === 'lcdot') {
      throw new InvalidCurrencyError('LcDOT balance is not supported')
    }
    return super.getBalance(api, address, asset)
  }
}

export default Acala
