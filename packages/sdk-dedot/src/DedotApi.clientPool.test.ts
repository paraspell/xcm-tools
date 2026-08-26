import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DedotApi from "./DedotApi";

const apiMocks = vi.hoisted(() => ({
  createMock: vi.fn(),
  systemChainMock: vi.fn().mockResolvedValue("Acala"),
  disconnectMock: vi.fn().mockResolvedValue(undefined),
}));

apiMocks.createMock.mockResolvedValue({
  rpc: {
    system_chain: apiMocks.systemChainMock,
  },
  disconnect: apiMocks.disconnectMock,
});

vi.mock("dedot", () => ({
  DedotClient: {
    new: apiMocks.createMock,
  },
  WsProvider: class WsProvider {
    constructor(_endpoint: unknown) {}
  },
}));

describe("DedotApi client pool hooks", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    apiMocks.systemChainMock.mockClear();
    apiMocks.disconnectMock.mockClear();
    apiMocks.createMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("pings via rpc.system_chain on TTL expiry and disconnects on eviction", async () => {
    const api = new DedotApi("wss://test");

    await api.init("Acala", 10);

    expect(apiMocks.createMock).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(11);
    await Promise.resolve();
    await Promise.resolve();
    expect(apiMocks.systemChainMock).toHaveBeenCalledTimes(1);

    await api.disconnect(false);
    expect(apiMocks.disconnectMock).toHaveBeenCalledTimes(1);
  });

  it("attaches a rejection handler when disconnect fails on eviction", async () => {
    let catchSpy: MockInstance | undefined;

    apiMocks.disconnectMock.mockImplementationOnce(() => {
      const rejected = Promise.reject(new Error("socket already closed"));
      catchSpy = vi.spyOn(rejected, "catch");
      return rejected;
    });

    const api = new DedotApi("wss://test2");

    await api.init("Acala", 10);

    vi.advanceTimersByTime(11);
    await Promise.resolve();
    await Promise.resolve();

    await api.disconnect(false);

    expect(catchSpy).toHaveBeenCalledTimes(1);
  });
});
