import type { TCurrencyCore, WithComplexAmount } from '@paraspell/assets'
import { findAssetInfoOrThrow } from '@paraspell/assets'
import { parseUnits } from 'viem'

import type { GeneralBuilder } from '../../builder'
import type { TCreateTxsOptions, TSendBaseOptionsWithSenderAddress } from '../../types'
import { assertToIsString } from '../assertions'
import { isConfig } from './isConfig'

export const computeOverridenAmount = <TApi, TRes>(
  options: TCreateTxsOptions<TApi, TRes>,
  increaseAmount: string
) => {
  const { from, to, currency, api } = options

  const amount = (options.currency as WithComplexAmount<TCurrencyCore>).amount

  const config = api.getConfig()
  if (isConfig(config) && config.abstractDecimals && typeof amount !== 'bigint') {
    return Number(increaseAmount) + Number(amount)
  } else {
    assertToIsString(to)
    const asset = findAssetInfoOrThrow(from, currency, to)
    return parseUnits(increaseAmount, asset.decimals) + BigInt(amount)
  }
}

export const overrideTxAmount = <TApi, TRes>(
  options: TCreateTxsOptions<TApi, TRes>,
  builder: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress>,
  amount: string
) => {
  const modifiedBuilder = builder.currency({
    ...options.currency,
    amount: computeOverridenAmount(options, amount)
  })

  return modifiedBuilder['buildInternal']()
}

export const createTx = async <TApi, TRes>(
  options: TCreateTxsOptions<TApi, TRes>,
  builder: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress>,
  amount: string | undefined
) => {
  if (amount === undefined) {
    return await builder['buildInternal']()
  }

  return await overrideTxAmount(options, builder, amount)
}
