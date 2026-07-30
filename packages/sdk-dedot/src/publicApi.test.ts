import {
  Builder as BuilderImpl,
  convertSs58 as convertSs58Impl,
  createChainClient as createChainClientImpl,
  dryRun as dryRunImpl,
  dryRunOrigin as dryRunOriginImpl,
  getBalance as getBalanceImpl,
  getBridgeStatus as getBridgeStatusImpl,
  getParaEthTransferFees as getEthFeesImpl,
} from "@paraspell/sdk-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { convertSs58 } from "./address";
import { getBalance } from "./assets";
import { Builder } from "./builder";
import DedotApi from "./DedotApi";
import {
  dryRun,
  dryRunOrigin,
  getBridgeStatus,
  getParaEthTransferFees,
} from "./transfer";
import { createChainClient, createDedotApiCall } from "./utils/utils";

vi.mock("@paraspell/sdk-core", { spy: true });

vi.mock("./DedotApi");

describe("sdk-dedot public API adapters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("converts an SS58 address with a Dedot API adapter", () => {
    vi.mocked(convertSs58Impl).mockReturnValue("converted");

    expect(convertSs58("address", "Acala")).toBe("converted");
    expect(convertSs58Impl).toHaveBeenCalledWith(
      expect.any(DedotApi),
      "address",
      "Acala",
    );
  });

  it("constructs the core builder with a Dedot API adapter", () => {
    const built = { build: vi.fn() };
    vi.mocked(BuilderImpl).mockReturnValue(built as never);

    expect(Builder("wss://example.test")).toBe(built);
    expect(DedotApi).toHaveBeenCalledWith("wss://example.test");
    expect(BuilderImpl).toHaveBeenCalledWith(expect.any(DedotApi));
  });

  it("creates a chain client with a Dedot API adapter", async () => {
    const client = { chain: "Acala" };
    vi.mocked(createChainClientImpl).mockResolvedValue(client);

    await expect(
      createChainClient("Acala", "wss://example.test"),
    ).resolves.toBe(client);
    expect(createChainClientImpl).toHaveBeenCalledWith(
      expect.any(DedotApi),
      "Acala",
    );
  });

  it("injects a Dedot API adapter into a generic API call", async () => {
    const apiCall = vi.fn().mockResolvedValue("result");
    const call = createDedotApiCall(apiCall);

    await expect(call({ api: "wss://example.test", value: 1 })).resolves.toBe(
      "result",
    );
    expect(apiCall).toHaveBeenCalledWith({
      api: expect.any(DedotApi),
      value: 1,
    });
  });

  it("delegates balance and dry-run calls through a Dedot API adapter", async () => {
    vi.mocked(getBalanceImpl).mockResolvedValue(10n);
    vi.mocked(dryRunImpl).mockResolvedValue({ success: true } as never);
    vi.mocked(dryRunOriginImpl).mockResolvedValue({ success: true } as never);

    await expect(
      getBalance({ chain: "Acala", address: "5Alice" } as never),
    ).resolves.toBe(10n);
    await expect(
      dryRun({ chain: "Acala", destination: "Astar" } as never),
    ).resolves.toEqual({ success: true });
    await expect(
      dryRunOrigin({ chain: "Acala", destination: "Astar" } as never),
    ).resolves.toEqual({ success: true });

    expect(getBalanceImpl).toHaveBeenCalledWith(
      expect.objectContaining({ api: expect.any(DedotApi) }),
    );
    expect(dryRunImpl).toHaveBeenCalledWith(
      expect.objectContaining({ api: expect.any(DedotApi) }),
    );
    expect(dryRunOriginImpl).toHaveBeenCalledWith(
      expect.objectContaining({ api: expect.any(DedotApi) }),
    );
  });

  it("initializes Asset Hub before retrieving Ethereum transfer fees", async () => {
    vi.mocked(getEthFeesImpl).mockResolvedValue({} as never);
    const init = vi
      .spyOn(DedotApi.prototype, "init")
      .mockResolvedValue(undefined);

    await getParaEthTransferFees("wss://example.test");

    expect(init).toHaveBeenCalledWith("AssetHubPolkadot", expect.any(Number));
    expect(getEthFeesImpl).toHaveBeenCalledWith(expect.any(DedotApi));
  });

  it("delegates bridge status retrieval with a Dedot API adapter", async () => {
    vi.mocked(getBridgeStatusImpl).mockResolvedValue("Normal");

    await expect(getBridgeStatus("wss://example.test")).resolves.toBe("Normal");
    expect(getBridgeStatusImpl).toHaveBeenCalledWith(expect.any(DedotApi));
  });
});
