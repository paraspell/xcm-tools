import type { TCurrencyCore, WithAmount } from '@paraspell/assets'

import type { IPolkadotApi } from '../api'
import { AMOUNT_ALL, MIN_AMOUNT } from '../constants'
import { getTransferableAmountInternal } from '../transfer'
import type { TSendBaseOptions, TSendOptions, TTxFactory } from '../types'
import { assertSenderAddress, assertToIsString } from '../utils'
import type { GeneralBuilder } from './Builder'

export const normalizeAmountAll = async <TApi, TRes, TOptions extends TSendBaseOptions>(
  api: IPolkadotApi<TApi, TRes>,
  builder: GeneralBuilder<TApi, TRes, TOptions>,
  options: TOptions
): Promise<{ options: TSendOptions<TApi, TRes> & TOptions; buildTx: TTxFactory<TRes> }> => {
  const { currency } = options

  const isAmountAll = !Array.isArray(currency) && currency.amount === AMOUNT_ALL

  if (!isAmountAll)
    return { options: { api, isAmountAll, ...options }, buildTx: builder['createTxFactory']() }

  const builderWithMinAmount = builder.currency({
    ...options.currency,
    amount: MIN_AMOUNT
  })
  const buildTx = builderWithMinAmount['createTxFactory']()

  assertToIsString(options.to)
  assertSenderAddress(options.senderAddress)

  const transferable = await getTransferableAmountInternal({
    api,
    buildTx,
    origin: options.from,
    destination: options.to,
    senderAddress: options.senderAddress,
    feeAsset: options.feeAsset,
    currency: { ...currency, amount: MIN_AMOUNT } as WithAmount<TCurrencyCore>
  })

  const finalBuildTx = builder
    .currency({
      ...options.currency,
      amount: transferable
    })
    ['createTxFactory']()

  return {
    options: {
      ...options,
      api,
      isAmountAll,
      currency: { ...currency, amount: transferable }
    },
    buildTx: finalBuildTx
  }
}
