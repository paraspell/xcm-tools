import type { DedotClient } from "dedot";
import type {
  ChainSubmittableExtrinsic,
  GenericSubstrateApi,
  IKeyringPair,
} from "dedot/types";

export type TDedotApi = DedotClient<GenericSubstrateApi>;
export type TDedotExtrinsic = ChainSubmittableExtrinsic;
export type TDedotSigner = IKeyringPair;
