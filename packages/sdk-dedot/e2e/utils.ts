import { DEV_PHRASE, Keyring } from "@polkadot/keyring";
import { expect } from "vitest";
import type {
  TDedotExtrinsic,
  TDedotSigner,
  TPallet,
  TSerializedExtrinsics,
} from "../src";

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

export const validateTx = async (tx: TDedotExtrinsic, signer: TDedotSigner) => {
  expect(tx).toBeDefined();
  const hex = await tx.sign(signer);
  expect(hex).toBeDefined();
  const serialized = serializeTx(tx);
  expect(serialized).toMatchSnapshot();
};

export const createSigners = (): [TDedotSigner, TDedotSigner] => [
  createSr25519Signer("//Alice"),
  getEcdsaSigner(),
];
