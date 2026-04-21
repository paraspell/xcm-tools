import { DEFAULT_SWAP_SLIPPAGE } from '../../constants'
import { UnsupportedOperationError } from '../../errors'
import type {
  TApiOrUrl,
  TBuilderConfig,
  TBuilderOptions,
  TExchangeInput,
  TTransferOptionsWithSwap,
  TUrl
} from '../../types'
import { assertAddressIsString, assertSender, assertToIsString } from '../assertions'
import { isConfig } from '../guards'
import { getSwapExtensionOrThrow } from './swapRegistry'

const isUrl = (value: unknown): value is string | string[] =>
  typeof value === 'string' || Array.isArray(value)

export const convertBuilderConfig = <TApi>(
  config: TBuilderOptions<TApiOrUrl<TApi>> | undefined
): TBuilderConfig<TUrl> | undefined => {
  if (!config) return undefined

  if (isConfig(config)) {
    const { apiOverrides, ...rest } = config

    if (!apiOverrides) {
      return rest
    }

    if (
      config.apiOverrides &&
      Object.values(config.apiOverrides).some(url => typeof url === 'object')
    ) {
      throw new UnsupportedOperationError(
        'Swap module does not support API client override with non-string values'
      )
    }

    const filteredApiOverrides = Object.fromEntries(
      Object.entries(apiOverrides).filter(([, value]) => isUrl(value))
    )

    return {
      ...config,
      apiOverrides: filteredApiOverrides
    }
  }

  const isWsUrl = typeof config === 'string' && Array.isArray(config)
  if (!isWsUrl) {
    throw new UnsupportedOperationError('Swap module does not support API client override')
  }
}

export const createRouterBuilder = <TApi, TRes, TSigner>(
  options: TTransferOptionsWithSwap<TApi, TRes, TSigner>
) => {
  const { api } = options

  if (options.transactOptions?.call) {
    throw new UnsupportedOperationError('Cannot use transact options together with swap options.')
  }

  const { RouterBuilder } = getSwapExtensionOrThrow()

  const {
    from,
    to,
    currency,
    swapOptions: { currencyTo, evmSenderAddress, exchange, slippage, onStatusChange },
    sender,
    recipient: address
  } = options

  assertToIsString(to)
  assertAddressIsString(address)
  assertSender(sender)

  if (Array.isArray(currency)) {
    throw new UnsupportedOperationError('Swaps with multiple currencies are not supported.')
  }

  // @ts-expect-error - Will be removed in the next version
  let builder = RouterBuilder(api)
    .from(from)
    .exchange(exchange)
    .to(to)
    .currencyFrom(currency)
    .currencyTo(currencyTo)
    .amount(currency.amount)
    .sender(sender)
    .evmSenderAddress(evmSenderAddress)
    .recipient(address)
    .slippagePct(slippage?.toString() ?? DEFAULT_SWAP_SLIPPAGE.toString())

  if (onStatusChange) {
    // @ts-expect-error - Will be removed in the next version
    builder = builder.onStatusChange(onStatusChange)
  }

  return builder
}

export const executeWithRouter = async <TApi, TRes, TSigner, T>(
  options: TTransferOptionsWithSwap<TApi, TRes, TSigner>,
  executor: (builder: ReturnType<typeof createRouterBuilder<TApi, TRes, TSigner>>) => Promise<T>
) => {
  const routerBuilder = createRouterBuilder(options)
  return executor(routerBuilder)
}

export const normalizeExchange = (exchange: TExchangeInput): TExchangeInput =>
  Array.isArray(exchange)
    ? exchange.length === 0
      ? undefined
      : exchange.length === 1
        ? exchange[0]
        : exchange
    : exchange
