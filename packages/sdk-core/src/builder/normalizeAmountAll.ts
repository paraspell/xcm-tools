import type { PolkadotApi } from '../api'
import { AMOUNT_ALL, MIN_AMOUNT } from '../constants'
import { getTransferableAmountInternal } from '../transfer'
import type { TTransferBaseOptions, TTransferOptions, TTxFactory } from '../types'
import {
  assertCurrencyCore,
  assertSender,
  assertSubstrateOrigin,
  assertToIsString,
  executeWithSwap
} from '../utils'
import type { GeneralBuilder } from './Builder'

export const normalizeAmountAll = async <
  TApi,
  TRes,
  TSigner,
  TOptions extends TTransferBaseOptions<TApi, TRes, TSigner>,
  TCustomChain extends string = never
>(
  api: PolkadotApi<TApi, TRes, TSigner, TCustomChain>,
  builder: GeneralBuilder<TApi, TRes, TSigner, TOptions, TCustomChain>,
  options: TOptions
): Promise<{
  options: TTransferOptions<TApi, TRes, TSigner, TCustomChain> & TOptions
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
  assertCurrencyCore(currency)

  const transferable = swapOptions
    ? await executeWithSwap({ ...options, api, from, swapOptions }, builder =>
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
        currency: { ...currency, amount: MIN_AMOUNT }
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
