import type {
  GeneralBuilder as GeneralBuilderCore,
  TApiOrUrl,
  TBuilderOptions,
  TCustomChainFrom,
  TTransferBaseOptions,
} from "@paraspell/sdk-core";
import { Builder as BuilderImpl } from "@paraspell/sdk-core";

import DedotApi from "./DedotApi";
import type { TDedotApi, TDedotExtrinsic, TDedotSigner } from "./types";

/**
 * Creates a new Builder instance.
 *
 * @param options - Either an existing API instance, a WS URL, or a config object.
 * @returns A new Builder instance.
 */
export const Builder = <
  const TOpts extends TBuilderOptions<TApiOrUrl<TDedotApi>>,
>(
  options?: TOpts,
) => {
  const dedotApi = new DedotApi<TCustomChainFrom<TOpts>>(options);
  return BuilderImpl<
    TDedotApi,
    TDedotExtrinsic,
    TDedotSigner,
    TCustomChainFrom<TOpts>
  >(dedotApi);
};

export type GeneralBuilder<
  T extends Partial<
    TTransferBaseOptions<TDedotApi, TDedotExtrinsic, TDedotSigner>
  > = object,
  TCustomChain extends string = never,
> = GeneralBuilderCore<
  TDedotApi,
  TDedotExtrinsic,
  TDedotSigner,
  T,
  TCustomChain
>;
