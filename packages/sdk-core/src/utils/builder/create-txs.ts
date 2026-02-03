import type { TCurrencyCore, WithComplexAmount } from '@paraspell/assets'
import { findAssetInfoOrThrow } from '@paraspell/assets'

import type { GeneralBuilder } from '../../builder'
import type { TCreateTxsOptions, TSendBaseOptions } from '../../types'
import { assertToIsString } from '../assertions'
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
  builder: GeneralBuilder<TApi, TRes, TSigner, TSendBaseOptions<TRes>>,
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

export const createTx = async <TApi, TRes, TSigner>(
  options: TCreateTxsOptions<TApi, TRes, TSigner>,
  builder: GeneralBuilder<TApi, TRes, TSigner, TSendBaseOptions<TRes>>,
  amount?: string,
  relative?: boolean
): Promise<TRes> => {
  if (amount === undefined) {
    const { tx } = await builder['buildInternal']()
    return tx
  }

  return await overrideTxAmount(options, builder, amount, relative)
}
