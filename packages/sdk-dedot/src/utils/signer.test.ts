import { getEvmPrivateKeyHex } from "@paraspell/sdk-core";
import { Keyring } from "@polkadot/keyring";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createKeyringPair } from "./signer";

const createFromUri = vi.fn();
const addFromUri = vi.fn();

function MockKeyring() {
  return { createFromUri, addFromUri };
}

vi.mock("@paraspell/sdk-core");

vi.mock("@polkadot/keyring");

describe("createKeyringPair", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Keyring).mockImplementation(MockKeyring);
  });

  it("creates an Ethereum pair when the path resolves to an EVM key", () => {
    const pair = { address: "0xabc" };
    vi.mocked(getEvmPrivateKeyHex).mockReturnValue("0xprivate" as never);
    createFromUri.mockReturnValue(pair);

    expect(createKeyringPair("//Alice")).toBe(pair);
    expect(Keyring).toHaveBeenCalledWith();
    expect(createFromUri).toHaveBeenCalledWith(
      "0xprivate",
      undefined,
      "ethereum",
    );
    expect(addFromUri).not.toHaveBeenCalled();
  });

  it("creates an sr25519 pair for a Substrate path", () => {
    const pair = { address: "5Alice" };
    vi.mocked(getEvmPrivateKeyHex).mockReturnValue(undefined);
    addFromUri.mockReturnValue(pair);

    expect(createKeyringPair("//Alice")).toBe(pair);
    expect(Keyring).toHaveBeenCalledWith({ type: "sr25519" });
    expect(addFromUri).toHaveBeenCalledWith("//Alice");
    expect(createFromUri).not.toHaveBeenCalled();
  });
});
