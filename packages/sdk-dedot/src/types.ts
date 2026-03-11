import type { TApiOrUrl } from "@paraspell/sdk-core";
import type { DedotClient } from "dedot";
import type {
  ChainSubmittableExtrinsic,
  GenericSubstrateApi,
  IKeyringPair,
} from "dedot/types";

export type TDedotApi = DedotClient<GenericSubstrateApi>;
export type TDedotApiOrUrl = TApiOrUrl<TDedotApi>;
export type TDedotExtrinsic = ChainSubmittableExtrinsic;
export type TDedotSigner = IKeyringPair;
