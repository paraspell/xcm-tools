import type * as SwapModule from '@paraspell/swap'

import { DEFAULT_SWAP_SLIPPAGE } from '../../constants'
import { ExtensionNotInstalledError, UnsupportedOperationError } from '../../errors'
import type {
  TApiOrUrl,
  TBuilderConfig,
  TBuilderOptions,
  TExchangeInput,
  TTransferOptionsWithSwap,
  TUrl
} from '../../types'
import { assertAddressIsString, assertSender, assertToIsString } from '../assertions'
import { isConfig } from '../builder'

type TRouterBuilderOptions = Omit<TBuilderConfig<TUrl>, 'xcmFormatCheck'>

const isUrl = (value: unknown): value is string | string[] =>
  typeof value === 'string' || Array.isArray(value)

const convertBuilderConfig = <TApi>(
  config: TBuilderOptions<TApiOrUrl<TApi>> | undefined
): TRouterBuilderOptions | undefined => {
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

const importSwapModuleOrThrow = async () => {
  const MODULE_NAME = '@paraspell/swap'

  try {
    // We separate the types from the actual import to avoid issues
    // with webpack during build
    return (await import(MODULE_NAME)) as typeof SwapModule
  } catch {
    throw new ExtensionNotInstalledError(
      `The swap package is required to use swaps. Please install ${MODULE_NAME}.`
    )
  }
}

export const createRouterBuilder = async <TApi, TRes, TSigner>(
  options: TTransferOptionsWithSwap<TApi, TRes, TSigner>
) => {
  const { api } = options

  if (options.transactOptions?.call) {
    throw new UnsupportedOperationError('Cannot use transact options together with swap options.')
  }

  if (api.getType() !== 'PAPI') {
    throw new UnsupportedOperationError('Swaps are only supported when using PAPI SDK.')
  }

  const { RouterBuilder } = await importSwapModuleOrThrow()

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

  const config = api.getConfig()

  const routerConfig = convertBuilderConfig(config)

  let builder = RouterBuilder(routerConfig)
    .from(from)
    .exchange(exchange)
    .to(to)
    .currencyFrom(currency)
    .currencyTo(currencyTo)
    .amount(currency.amount)
    .senderAddress(sender)
    .evmSenderAddress(evmSenderAddress)
    .recipientAddress(address)
    .slippagePct(slippage?.toString() ?? DEFAULT_SWAP_SLIPPAGE.toString())

  if (onStatusChange) {
    // We cast because router types are bind to specific PAPI types
    // Will be resolved when we make RouterBuilder generic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    builder = builder.onStatusChange(onStatusChange as any)
  }

  return builder
}

export const executeWithRouter = async <TApi, TRes, TSigner, T>(
  options: TTransferOptionsWithSwap<TApi, TRes, TSigner>,
  executor: (builder: Awaited<ReturnType<typeof createRouterBuilder>>) => Promise<T>
) => {
  const routerBuilder = await createRouterBuilder(options)
  return executor(routerBuilder)
}

export const normalizeExchange = (exchange: TExchangeInput): TExchangeInput =>
  Array.isArray(exchange) && exchange.length === 0 ? undefined : exchange
