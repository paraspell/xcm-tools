import type {
  GeneralBuilder as GeneralBuilderCore,
  TApiOrUrl,
  TBuilderOptions,
  TTransferBaseOptions,
} from "@paraspell/sdk-core";
import { Builder as BuilderImpl } from "@paraspell/sdk-core";

import DedotApi from "./DedotApi";
import type { TDedotApi, TDedotExtrinsic, TDedotSigner } from "./types";

/**
 * Creates a new Builder instance using the Dedot client.
 *
 * @param api - The API instance or options to use for building transactions.
 * @returns A new Builder instance.
 */
export const Builder = (api?: TBuilderOptions<TApiOrUrl<TDedotApi>>) => {
  const dedotApi = new DedotApi(api);
  return BuilderImpl<TDedotApi, TDedotExtrinsic, TDedotSigner>(dedotApi);
};

export type GeneralBuilder<
  T extends Partial<
    TTransferBaseOptions<TDedotApi, TDedotExtrinsic, TDedotSigner>
  > = object,
> = GeneralBuilderCore<TDedotApi, TDedotExtrinsic, TDedotSigner, T>;
