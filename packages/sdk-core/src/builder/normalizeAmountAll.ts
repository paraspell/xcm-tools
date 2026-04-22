import type { TCurrencyCore, WithAmount } from '@paraspell/assets'

import type { PolkadotApi } from '../api'
import { AMOUNT_ALL, MIN_AMOUNT } from '../constants'
import { getTransferableAmountInternal } from '../transfer'
import type { TTransferBaseOptions, TTransferOptions, TTxFactory } from '../types'
import { assertSender, assertSubstrateOrigin, assertToIsString, executeWithRouter } from '../utils'
import type { GeneralBuilder } from './Builder'

export const normalizeAmountAll = async <
  TApi,
  TRes,
  TSigner,
  TOptions extends TTransferBaseOptions<TApi, TRes, TSigner>
>(
  api: PolkadotApi<TApi, TRes, TSigner>,
  builder: GeneralBuilder<TApi, TRes, TSigner, TOptions>,
  options: TOptions
): Promise<{
  options: TTransferOptions<TApi, TRes, TSigner> & TOptions
  buildTx: TTxFactory<TRes>
}> => {
  const { currency, swapOptions, from } = options

  const isAmountAll = !Array.isArray(currency) && currency.amount === AMOUNT_ALL

  if (!isAmountAll)
    return { options: { api, isAmountAll, ...options }, buildTx: builder['createTxFactory']() }

  assertSubstrateOrigin(from)

  const builderWithMinAmount = builder.currency({
    ...options.currency,
    amount: MIN_AMOUNT
  })
  const buildTx = builderWithMinAmount['createTxFactory']()

  assertToIsString(options.to)
  assertSender(options.sender)

  const transferable = swapOptions
    ? await executeWithRouter({ ...options, api, from, swapOptions }, builder =>
        builder.getTransferableAmount()
      )
    : await getTransferableAmountInternal({
        api,
        buildTx,
        origin: from,
        destination: options.to,
        sender: options.sender,
        feeAsset: options.feeAsset,
        version: options.version,
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
