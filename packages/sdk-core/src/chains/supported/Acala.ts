// Contains detailed structure of XCM call construction for Acala Parachain

import type { TAssetInfo } from '@paraspell/assets'
import { InvalidCurrencyError } from '@paraspell/assets'
import type { TParachain, TRelaychain } from '@paraspell/sdk-common'
import { Version } from '@paraspell/sdk-common'

import type { IPolkadotApi } from '../../api'
import { MIN_AMOUNT } from '../../constants'
import { transferPolkadotXcm } from '../../pallets/polkadotXcm'
import type {
  IPolkadotXCMTransfer,
  TPolkadotXCMTransferOptions,
  TTransferLocalOptions
} from '../../types'
import { type TForeignOrTokenAsset } from '../../types'
import { assertSenderAddress } from '../../utils'
import Chain from '../Chain'

class Acala<TApi, TRes> extends Chain<TApi, TRes> implements IPolkadotXCMTransfer {
  constructor(
    chain: TParachain = 'Acala',
    info: string = 'acala',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  transferPolkadotXCM<TApi, TRes>(input: TPolkadotXCMTransferOptions<TApi, TRes>): Promise<TRes> {
    return transferPolkadotXcm(input)
  }

  isRelayToParaEnabled(): boolean {
    return false
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
    return asset.isNative ? { Token: symbol } : { ForeignAsset: Number(asset.assetId) }
  }

  getBalance(api: IPolkadotApi<TApi, TRes>, address: string, asset: TAssetInfo): Promise<bigint> {
    if (asset.symbol.toLowerCase() === 'lcdot') {
      throw new InvalidCurrencyError('LcDOT balance is not supported')
    }
    return super.getBalance(api, address, asset)
  }
}

export default Acala
