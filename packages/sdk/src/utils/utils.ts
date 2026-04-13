/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PolkadotApi, TApiOrUrl, TBuilderOptions, TSubstrateChain } from '@paraspell/sdk-core'
import { createChainClient as createChainClientInternal } from '@paraspell/sdk-core'

import PapiApi from '../PapiApi'
import type { TPapiApi, TPapiSigner, TPapiTransaction } from '../types'

export const createChainClient = (
  chain: TSubstrateChain,
  api?: TBuilderOptions<TApiOrUrl<TPapiApi>>
) => {
  const papiApi = new PapiApi(api)
  return createChainClientInternal<TPapiApi, TPapiTransaction, TPapiSigner>(papiApi, chain)
}

export const createPapiApiCall = <TArgs extends Record<string, unknown>, TResult>(
  apiCall: (
    options: TArgs & { api: PolkadotApi<TPapiApi, TPapiTransaction, TPapiSigner> }
  ) => Promise<TResult>
) => {
  return async (options: TArgs & { api?: TApiOrUrl<TPapiApi> }): Promise<TResult> => {
    const papiApi = new PapiApi(options.api)

    const optionsWithApi = {
      ...options,
      api: papiApi as PolkadotApi<TPapiApi, TPapiTransaction, TPapiSigner>
    } as TArgs & { api: PolkadotApi<TPapiApi, TPapiTransaction, TPapiSigner> }

    return apiCall(optionsWithApi)
  }
}

export const extractDestParaId = (forwardedXcms: any[]): number | undefined => {
  if (forwardedXcms.length === 0) return undefined

  const interior = forwardedXcms[0].value.interior

  if (interior.type === 'Here') return 0

  if (interior.type === 'X1' && interior.value.type === 'Parachain') {
    return interior.value.value as number
  }

  return undefined
}

export const findFailingEvent = (result: any) =>
  result.value?.emitted_events?.find(
    (event: any) =>
      event.type === 'Utility' &&
      event.value.type === 'DispatchedAs' &&
      event.value.value.result.success === false
  )
