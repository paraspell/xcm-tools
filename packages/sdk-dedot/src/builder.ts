import type {
  GeneralBuilder as GeneralBuilderCore,
  TBuilderOptions,
  TSendBaseOptions
} from '@paraspell/sdk-core'
import { Builder as BuilderImpl } from '@paraspell/sdk-core'

import DedotApi from './DedotApi'
import type { TDedotApi, TDedotApiOrUrl, TDedotExtrinsic, TDedotSigner } from './types'

/**
 * Creates a new Builder instance using the Dedot client.
 *
 * @param api - The API instance or options to use for building transactions.
 * @returns A new Builder instance.
 */
export const Builder = (api?: TBuilderOptions<TDedotApiOrUrl>) => {
  const dedotApi = new DedotApi(api)
  return BuilderImpl<TDedotApi, TDedotExtrinsic, TDedotSigner>(dedotApi)
}

export type GeneralBuilder<
  T extends Partial<TSendBaseOptions<TDedotApi, TDedotExtrinsic, TDedotSigner>> = object
> = GeneralBuilderCore<TDedotApi, TDedotExtrinsic, TDedotSigner, T>
