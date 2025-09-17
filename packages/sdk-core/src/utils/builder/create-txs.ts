import { findAssetInfoOrThrow } from '@paraspell/assets'
import { parseUnits } from 'viem'

import type { GeneralBuilder } from '../../builder'
import { BYPASS_CURRENCY_AMOUNT } from '../../constants'
import type { TCreateTxsOptions, TSendBaseOptionsWithSenderAddress } from '../../types'
import { assertToIsString } from '../assertions'
import { isConfig } from './isConfig'

export const computeOverridenAmount = <TApi, TRes>(options: TCreateTxsOptions<TApi, TRes>) => {
  const { from, to, currency, api } = options

  const config = api.getConfig()
  if (isConfig(config) && config.abstractDecimals) {
    return BYPASS_CURRENCY_AMOUNT
  } else {
    assertToIsString(to)
    const asset = findAssetInfoOrThrow(from, currency, to)
    return parseUnits(BYPASS_CURRENCY_AMOUNT, asset.decimals)
  }
}

export const overrideTxAmount = <TApi, TRes>(
  options: TCreateTxsOptions<TApi, TRes>,
  builder: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress>
) => {
  const modifiedBuilder = builder.currency({
    ...options.currency,
    amount: computeOverridenAmount(options)
  })

  return modifiedBuilder['buildInternal']()
}

export const createTxs = async <TApi, TRes>(
  options: TCreateTxsOptions<TApi, TRes>,
  builder: GeneralBuilder<TApi, TRes, TSendBaseOptionsWithSenderAddress>
) => {
  // Let's create 2 tx, one with real amount and one with bypass amount
  const tx = await builder['buildInternal']()
  const txBypass = await overrideTxAmount(options, builder)

  return { tx, txBypass }
}
