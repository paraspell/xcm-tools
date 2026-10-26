import { DEV_PHRASE, Keyring } from "@polkadot/keyring";
import type {
  TDedotExtrinsic,
  TDedotSigner,
  TPallet,
  TSerializedExtrinsics,
} from "../src";
import { createTxValidator } from "../../sdk-core/e2e";

export const createSr25519Signer = (path: string): TDedotSigner => {
  const keyring = new Keyring({ type: "sr25519" });
  return keyring.addFromUri(path);
};

export const getEcdsaSigner = (): TDedotSigner => {
  const keyring = new Keyring({ type: "ethereum" });
  return keyring.addFromUri(DEV_PHRASE);
};

const serializeTx = (tx: TDedotExtrinsic): TSerializedExtrinsics => {
  const call = tx.call;
  return {
    module: call.pallet as TPallet,
    method: call.palletCall.name,
    params: call.palletCall.params,
  };
};

export const validateTx = createTxValidator(
  serializeTx,
  (tx, signer: TDedotSigner) => tx.sign(signer),
);

export const createSigners = (): [TDedotSigner, TDedotSigner] => [
  createSr25519Signer("//Alice"),
  getEcdsaSigner(),
];
