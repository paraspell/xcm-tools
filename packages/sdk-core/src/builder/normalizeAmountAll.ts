import type { TCurrencyCore, WithAmount } from '@paraspell/assets'

import type { IPolkadotApi } from '../api'
import { AMOUNT_ALL, MIN_AMOUNT } from '../constants'
import { getTransferableAmountInternal } from '../transfer'
import type { TSendBaseOptions, TSendOptions } from '../types'
import { assertSenderAddress, assertToIsString } from '../utils'

export const normalizeAmountAll = async <TApi, TRes, TOptions extends TSendBaseOptions>(
  api: IPolkadotApi<TApi, TRes>,
  buildTx: (amount?: string) => Promise<TRes>,
  options: TOptions
): Promise<TSendOptions<TApi, TRes> & TOptions> => {
  const { currency } = options

  const isAmountAll = !Array.isArray(currency) && currency.amount === AMOUNT_ALL

  if (!isAmountAll) return { api, isAmountAll, ...options }

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

  return {
    ...options,
    api,
    isAmountAll,
    currency: { ...currency, amount: transferable }
  }
}
