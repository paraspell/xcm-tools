import type { TCurrencyCore, WithComplexAmount } from '@paraspell/assets'
import { findAssetInfoOrThrow } from '@paraspell/assets'

import type { GeneralBuilder } from '../../builder'
import { UnsupportedOperationError } from '../../errors'
import { createTransfer } from '../../transfer'
import type {
  TCreateTxsOptions,
  TSendBaseOptions,
  TSendOptions,
  TTransactionContext
} from '../../types'
import { assertToIsString } from '../assertions'
import { executeWithRouter } from '../swap'
import { parseUnits } from '../unit'
import { isConfig } from './isConfig'

export const computeOverridenAmount = <TApi, TRes, TSigner>(
  options: TCreateTxsOptions<TApi, TRes, TSigner>,
  increaseAmount: string,
  relative: boolean = true
) => {
  const { from, to, currency, api } = options

  const amount = (options.currency as WithComplexAmount<TCurrencyCore>).amount

  const config = api.getConfig()
  if (isConfig(config) && config.abstractDecimals && typeof amount !== 'bigint') {
    const base = relative ? Number(amount) : 0
    return Number(increaseAmount) + base
  } else {
    assertToIsString(to)
    const asset = findAssetInfoOrThrow(from, currency, to)
    const base = relative ? BigInt(amount) : 0n
    return parseUnits(increaseAmount, asset.decimals) + base
  }
}

export const overrideTxAmount = async <TApi, TRes, TSigner>(
  options: TCreateTxsOptions<TApi, TRes, TSigner>,
  builder: GeneralBuilder<TApi, TRes, TSigner, TSendBaseOptions<TApi, TRes, TSigner>>,
  amount: string,
  relative?: boolean
) => {
  const modifiedBuilder = builder.currency({
    ...options.currency,
    amount: computeOverridenAmount(options, amount, relative)
  })

  const { tx } = await modifiedBuilder['buildInternal']()
  return tx
}

export const createTxOverrideAmount = async <TApi, TRes, TSigner>(
  options: TCreateTxsOptions<TApi, TRes, TSigner>,
  builder: GeneralBuilder<TApi, TRes, TSigner, TSendBaseOptions<TApi, TRes, TSigner>>,
  amount?: string,
  relative?: boolean
): Promise<TRes> => {
  if (amount === undefined) {
    const { tx } = await builder['buildInternal']()
    return tx
  }

  return await overrideTxAmount(options, builder, amount, relative)
}

export const createTransferOrSwapAll = async <TApi, TRes, TSigner>(
  options: TSendOptions<TApi, TRes, TSigner>
): Promise<TTransactionContext<TApi, TRes>[]> => {
  const { api, from, swapOptions } = options

  if (swapOptions) {
    const transactions = await executeWithRouter({ ...options, swapOptions }, builder =>
      builder.buildTransactions()
    )

    // We use this cast because XCM Router is PAPI only,
    // but this code is in sdk-core package which is generic
    // Not ideal but .swap() method is only available for PAPI SDK anyway
    return transactions as unknown as TTransactionContext<TApi, TRes>[]
  }

  return [{ type: 'TRANSFER', api: api.getApi(), chain: from, tx: await createTransfer(options) }]
}

export const createTransferOrSwap = async <TApi, TRes, TSigner>(
  options: TSendOptions<TApi, TRes, TSigner>
): Promise<TRes> => {
  const res = await createTransferOrSwapAll(options)

  if (res.length > 1) {
    throw new UnsupportedOperationError(
      'This operation produces multiple transactions, but .build() only supports a single transaction. Use .buildAll() instead.'
    )
  }

  return res[0].tx
}
