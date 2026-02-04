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
import { getLocalTransferAmount } from '../../utils/transfer'
import Chain from '../Chain'

class Acala<TApi, TRes, TSigner>
  extends Chain<TApi, TRes, TSigner>
  implements IPolkadotXCMTransfer<TApi, TRes, TSigner>
{
  constructor(
    chain: TParachain = 'Acala',
    info: string = 'acala',
    ecosystem: TRelaychain = 'Polkadot',
    version: Version = Version.V5
  ) {
    super(chain, info, ecosystem, version)
  }

  transferPolkadotXCM(input: TPolkadotXCMTransferOptions<TApi, TRes, TSigner>): Promise<TRes> {
    return transferPolkadotXcm(input)
  }

  isRelayToParaEnabled(): boolean {
    return false
  }

  async transferLocalNativeAsset(
    options: TTransferLocalOptions<TApi, TRes, TSigner>
  ): Promise<TRes> {
    const { api, address, senderAddress, isAmountAll, keepAlive } = options

    const createTx = (amount: bigint) =>
      api.deserializeExtrinsics({
        module: 'Currencies',
        method: 'transfer_native_currency',
        params: {
          dest: { Id: address },
          amount
        }
      })

    let fee = 0n
    if (isAmountAll || keepAlive) {
      assertSenderAddress(senderAddress)
      const { partialFee } = await api.getPaymentInfo(createTx(MIN_AMOUNT), senderAddress)
      fee = BigInt(partialFee)
    }

    const amount = getLocalTransferAmount(options, fee)

    return createTx(amount)
  }

  transferLocalNonNativeAsset(options: TTransferLocalOptions<TApi, TRes, TSigner>): TRes {
    const { api, assetInfo: asset, address } = options

    if (asset.symbol.toLowerCase() === 'lcdot') {
      throw new InvalidCurrencyError('LcDOT local transfers are not supported')
    }

    const amount = getLocalTransferAmount(options)

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

  getBalance(
    api: IPolkadotApi<TApi, TRes, TSigner>,
    address: string,
    asset: TAssetInfo
  ): Promise<bigint> {
    if (asset.symbol.toLowerCase() === 'lcdot') {
      throw new InvalidCurrencyError('LcDOT balance is not supported')
    }
    return super.getBalance(api, address, asset)
  }
}

export default Acala
