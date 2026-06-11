import type { TCurrencyCore, TCurrencyInputWithAmount, WithComplexAmount } from '@paraspell/assets'

import type { GeneralBuilder } from '../../builder'
import { UnsupportedOperationError } from '../../errors'
import { createTransfer } from '../../transfer'
import { assertNotRawAssets } from '../../transfer/utils/validationUtils'
import type {
  TCreateTxsOptions,
  TSubstrateTransferOptions,
  TTransactionContext,
  TTransferBaseOptions
} from '../../types'
import { assertToIsString } from '../assertions'
import { isConfig } from '../guards'
import { executeWithSwap } from '../swap'
import { parseUnits } from '../unit'

export const computeOverridenAmount = <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TCreateTxsOptions<TApi, TRes, TSigner, TCustomChain>,
  increaseAmount: string,
  relative: boolean = true
) => {
  const { from, to, currency, api } = options

  const amount = (options.currency as WithComplexAmount<TCurrencyCore>).amount

  const { config } = api
  if (!(isConfig(config) && config.abstractDecimals === false) && typeof amount !== 'bigint') {
    const base = relative ? Number(amount) : 0
    return Number(increaseAmount) + base
  } else {
    assertToIsString(to)
    const asset = api.findAssetInfoOrThrow(from, currency, to)
    const base = relative ? BigInt(amount) : 0n
    return parseUnits(increaseAmount, asset.decimals) + base
  }
}

export const overrideTxAmount = async <TApi, TRes, TSigner, TCustomChain extends string = never>(
  options: TCreateTxsOptions<TApi, TRes, TSigner, TCustomChain>,
  builder: GeneralBuilder<
    TApi,
    TRes,
    TSigner,
    TTransferBaseOptions<TApi, TRes, TSigner>,
    TCustomChain
  >,
  amount: string,
  relative?: boolean
) => {
  const { currency } = options

  assertNotRawAssets(currency)

  const overrideAmount = (item: TCurrencyInputWithAmount) =>
    computeOverridenAmount({ ...options, currency: item }, amount, relative)

  const modifiedBuilder = builder.currency(
    Array.isArray(currency)
      ? currency.map(item => ({ ...item, amount: overrideAmount(item) }))
      : { ...currency, amount: overrideAmount(currency) }
  )

  const { tx } = await modifiedBuilder['buildInternal']()
  return tx
}

export const createTxOverrideAmount = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  options: TCreateTxsOptions<TApi, TRes, TSigner, TCustomChain>,
  builder: GeneralBuilder<
    TApi,
    TRes,
    TSigner,
    TTransferBaseOptions<TApi, TRes, TSigner>,
    TCustomChain
  >,
  amount?: string,
  relative?: boolean
): Promise<TRes> => {
  if (amount === undefined) {
    const { tx } = await builder['buildInternal']()
    return tx
  }

  return await overrideTxAmount(options, builder, amount, relative)
}

export const createTransferOrSwapAll = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  options: TSubstrateTransferOptions<TApi, TRes, TSigner, TCustomChain>
): Promise<TTransactionContext<TApi, TRes>[]> => {
  const { api, from, swapOptions } = options

  if (swapOptions) {
    return executeWithSwap({ ...options, swapOptions }, builder => builder.build())
  }

  const tx = await createTransfer(options)

  return [{ type: 'TRANSFER', api: api.api, chain: from, tx }]
}

export const createTransferOrSwap = async <
  TApi,
  TRes,
  TSigner,
  TCustomChain extends string = never
>(
  options: TSubstrateTransferOptions<TApi, TRes, TSigner, TCustomChain>
): Promise<TRes> => {
  const res = await createTransferOrSwapAll(options)

  if (res.length > 1) {
    throw new UnsupportedOperationError(
      'This operation produces multiple transactions, but .build() only supports a single transaction. Use .buildAll() instead.'
    )
  }

  return res[0].tx
}
