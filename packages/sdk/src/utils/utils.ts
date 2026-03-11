/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IPolkadotApi, TBuilderOptions, TSubstrateChain } from '@paraspell/sdk-core'
import { createChainClient as createChainClientInternal } from '@paraspell/sdk-core'

import PapiApi from '../PapiApi'
import type { TPapiApi, TPapiApiOrUrl, TPapiSigner, TPapiTransaction } from '../types'

export const createChainClient = (chain: TSubstrateChain, api?: TBuilderOptions<TPapiApiOrUrl>) => {
  const papiApi = new PapiApi(api)
  return createChainClientInternal<TPapiApi, TPapiTransaction, TPapiSigner>(papiApi, chain)
}

export const createPapiApiCall = <TArgs extends Record<string, unknown>, TResult>(
  apiCall: (
    options: TArgs & { api: IPolkadotApi<TPapiApi, TPapiTransaction, TPapiSigner> }
  ) => Promise<TResult>
) => {
  return async (options: TArgs & { api?: TPapiApiOrUrl }): Promise<TResult> => {
    const papiApi = new PapiApi(options.api)

    const optionsWithApi = {
      ...options,
      api: papiApi as IPolkadotApi<TPapiApi, TPapiTransaction, TPapiSigner>
    } as TArgs & { api: IPolkadotApi<TPapiApi, TPapiTransaction, TPapiSigner> }

    return apiCall(optionsWithApi)
  }
}

export const findFailingEvent = (result: any) =>
  result.value?.emitted_events?.find(
    (event: any) =>
      event.type === 'Utility' &&
      event.value.type === 'DispatchedAs' &&
      event.value.value.result.success === false
  )
