import type { Server, Socket } from 'socket.io';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LiveDataGateway } from './livedata.gateway.js';
import type { LiveXcmData, SubscanXcmItem } from './livedata.types.js';

vi.mock('./subscan.client');

const instantiateGateway = () => {
  const gateway = new LiveDataGateway();
  const client = gateway['client'];
  const clientInstance = client;
  const emit = vi.fn();

  gateway.afterInit({ emit } as unknown as Server);

  return { gateway, clientInstance, emit };
};

describe('LiveDataGateway', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts polling when clients connect and stops when last disconnects', () => {
    vi.useFakeTimers();
    const { gateway } = instantiateGateway();
    const gatewayAny = gateway as unknown as {
      timer?: NodeJS.Timeout;
      clients: Set<string>;
    };

    expect(gatewayAny.timer).toBeUndefined();

    gateway.handleConnection({ id: '1' } as Socket);

    const timerRef = gatewayAny.timer;
    expect(timerRef).toBeDefined();
    expect(gatewayAny.clients.size).toBe(1);

    gateway.handleConnection({ id: '2' } as Socket);
    expect(gatewayAny.clients.size).toBe(2);
    expect(gatewayAny.timer).toBe(timerRef);

    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    gateway.handleDisconnect({ id: '1' } as Socket);
    expect(gatewayAny.clients.size).toBe(1);
    expect(gatewayAny.timer).toBe(timerRef);

    gateway.handleDisconnect({ id: '2' } as Socket);

    expect(gatewayAny.clients.size).toBe(0);
    expect(gatewayAny.timer).toBeUndefined();
    expect(clearIntervalSpy).toHaveBeenCalledWith(timerRef);

    clearIntervalSpy.mockRestore();
    vi.useRealTimers();
  });

  it('poll emits newly seen items and skips duplicates', async () => {
    const { gateway, clientInstance, emit } = instantiateGateway();
    const items: SubscanXcmItem[] = [
      {
        message_hash: '0xaaa',
        unique_id: 'unique-1',
        relayed_block_timestamp: 111,
        origin_block_timestamp: 110,
        confirm_block_timestamp: 115,
        status: 'Completed',
        from_chain: 'polkadot',
        origin_para_id: 1000,
        dest_para_id: 2000,
      },
      {
        message_hash: '0xbbb',
        unique_id: 'unique-2',
        relayed_block_timestamp: 222,
        origin_block_timestamp: 220,
        confirm_block_timestamp: 225,
        status: 'Pending',
        from_chain: 'polkadot',
        origin_para_id: 1001,
        dest_para_id: 2001,
      },
    ];

    const listSpy = vi.spyOn(clientInstance, 'fetchLatestXcmList');

    listSpy.mockImplementation((params) => {
      if (params?.ecosystem === 'Polkadot') {
        return Promise.resolve(items);
      }
      return Promise.resolve<SubscanXcmItem[]>([]);
    });

    const gatewayWithPoll = gateway as unknown as {
      poll: () => Promise<LiveXcmData[]>;
    };

    const firstBatch = await gatewayWithPoll.poll();

    expect(listSpy).toHaveBeenCalledTimes(4);
    expect(listSpy).toHaveBeenCalledWith({
      row: 5,
      ecosystem: 'Polkadot',
    });

    expect(firstBatch).toHaveLength(2);
    expect(firstBatch).toEqual(
      expect.arrayContaining<LiveXcmData>([
        {
          ecosystem: 'Polkadot',
          status: 'Pending',
          hash: '0xbbb',
          id: 'unique-2',
          originTimestamp: 220,
          confirmTimestamp: 225,
          from: 1001,
          to: 2001,
        },
        {
          ecosystem: 'Polkadot',
          status: 'Completed',
          hash: '0xaaa',
          id: 'unique-1',
          originTimestamp: 110,
          confirmTimestamp: 115,
          from: 1000,
          to: 2000,
        },
      ]),
    );

    const secondBatch = await gatewayWithPoll.poll();

    expect(secondBatch).toHaveLength(0);
    expect(emit).not.toHaveBeenCalled();
  });

  it('addSeen evicts oldest identifiers when capacity is exceeded', () => {
    const { gateway } = instantiateGateway();
    const gatewayAny = gateway as unknown as {
      MAX_SIZE: number;
      addSeen: (id: string) => boolean;
      seen: Set<string>;
    };

    const maxSize = gatewayAny.MAX_SIZE;

    for (let i = 0; i < maxSize; i += 1) {
      expect(gatewayAny.addSeen(`id-${i}`)).toBe(true);
    }

    expect(gatewayAny.seen.size).toBe(maxSize);

    expect(gatewayAny.addSeen(`id-${maxSize}`)).toBe(true);
    expect(gatewayAny.seen.size).toBe(maxSize);
    expect(gatewayAny.seen.has('id-0')).toBe(false);
  });

  it('onModuleDestroy stops the polling interval', () => {
    vi.useFakeTimers();
    const { gateway } = instantiateGateway();
    const gatewayAny = gateway as unknown as { timer?: NodeJS.Timeout };

    gateway.handleConnection({ id: '1' } as Socket);
    expect(gatewayAny.timer).toBeDefined();

    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    gateway.onModuleDestroy();

    expect(gatewayAny.timer).toBeUndefined();
    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
    vi.useRealTimers();
  });

  it('calls unref() on the interval timer if available', () => {
    const unref = vi.fn();
    const realSetInterval = global.setInterval;
    global.setInterval = vi.fn(() => ({
      unref,
    })) as unknown as typeof setInterval;

    try {
      const { gateway } = instantiateGateway();
      gateway.handleConnection({ id: 'x' } as unknown as Socket);

      expect(global.setInterval).toHaveBeenCalled();
      expect(unref).toHaveBeenCalledTimes(1);
    } finally {
      global.setInterval = realSetInterval;
    }
  });

  it('does not start polling again if a timer already exists (early return path)', () => {
    vi.useFakeTimers();

    const { gateway } = instantiateGateway();
    const gatewayAny = gateway as unknown as {
      timer?: NodeJS.Timeout;
      poll: () => Promise<void>;
    };

    gateway.handleConnection({ id: 'a' } as unknown as Socket);
    const firstTimer = gatewayAny.timer;
    expect(firstTimer).toBeDefined();

    const pollSpy = vi.spyOn(gatewayAny, 'poll');
    gateway.handleConnection({ id: 'b' } as unknown as Socket);

    expect(pollSpy).not.toHaveBeenCalled();
    expect(gatewayAny.timer).toBe(firstTimer);

    vi.useRealTimers();
  });

  it('interval tick detects zero clients and stops polling (internal branch)', async () => {
    vi.useFakeTimers();

    const { gateway } = instantiateGateway();
    const gatewayAny = gateway as unknown as {
      clients: Set<string>;
      timer?: NodeJS.Timeout;
      INTERVAL: number;
      stopPolling: () => void;
    };

    gateway.handleConnection({ id: 'solo' } as unknown as Socket);
    expect(gatewayAny.timer).toBeDefined();

    const stopSpy = vi.spyOn(gatewayAny, 'stopPolling');
    gatewayAny.clients.clear();

    vi.advanceTimersByTime(gatewayAny.INTERVAL);
    await Promise.resolve();

    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(gatewayAny.timer).toBeUndefined();

    vi.useRealTimers();
  });

  it('logs and recovers when poll rejects inside the interval loop', async () => {
    vi.useFakeTimers();
    const { gateway, emit } = instantiateGateway();
    const gatewayAny = gateway as unknown as {
      poll: () => Promise<LiveXcmData[]>;
      printError: (error: Error) => void;
      INTERVAL: number;
    };

    const error = new Error('poll failed');

    const pollSpy = vi
      .spyOn(gatewayAny, 'poll')
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(error);

    const printErrorSpy = vi
      .spyOn(gatewayAny, 'printError')
      .mockImplementation(() => {});

    gateway.handleConnection({ id: 'client-1' } as unknown as Socket);

    await Promise.resolve();

    vi.advanceTimersByTime(gatewayAny.INTERVAL);
    await Promise.resolve();
    await Promise.resolve();

    expect(printErrorSpy).toHaveBeenCalledWith(error);
    expect(emit).not.toHaveBeenCalled();

    gateway.handleDisconnect({ id: 'client-1' } as unknown as Socket);

    pollSpy.mockRestore();
    printErrorSpy.mockRestore();
    vi.useRealTimers();
  });

  it('printError logs the formatted message', () => {
    const { gateway } = instantiateGateway();
    const gatewayAny = gateway as unknown as { printError: (e: Error) => void };

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    gatewayAny.printError(new Error('boom'));
    expect(spy).toHaveBeenCalledWith('[WebSocket] Subscan poll error:', 'boom');
    spy.mockRestore();
  });
});
