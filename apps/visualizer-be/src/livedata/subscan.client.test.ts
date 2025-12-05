import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SubscanClient } from './subscan.client.js';

vi.mock('axios');

describe('SubscanClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchLatestXcmList should return normalized items', async () => {
    const postMock = vi.fn().mockResolvedValue({
      data: {
        code: 0,
        data: {
          list: [
            {
              message_hash: '0xhash1',
              unique_id: 'unique-1',
              relayed_block_timestamp: 123,
              status: 'Completed',
              from_chain: 'polkadot',
              origin_para_id: 1000,
              dest_para_id: 2000,
            },
            {
              message_hash: '0xhash2',
              unique_id: 'unique-2',
              relayed_block_timestamp: 456,
              status: 'Pending',
              from_chain: 'polkadot',
              origin_para_id: 1001,
              dest_para_id: 2001,
            },
          ],
        },
      },
    });

    const createSpy = vi.spyOn(axios, 'create');

    createSpy.mockReturnValue({
      post: postMock,
    } as unknown as AxiosInstance);

    const client = new SubscanClient({ apiKey: 'test-key' });

    const result = await client.fetchLatestXcmList({
      ecosystem: 'Polkadot',
      row: 3,
    });

    const [[createConfig]] = createSpy.mock.calls;
    expect(createConfig).toEqual({
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-API-Key': 'test-key',
      },
    });

    expect(postMock).toHaveBeenCalledWith(
      'https://polkadot.api.subscan.io/api/scan/xcm/list',
      {
        page: 0,
        row: 3,
      },
    );

    expect(result).toEqual([
      {
        message_hash: '0xhash1',
        unique_id: 'unique-1',
        relayed_block_timestamp: 123,
        status: 'Completed',
        from_chain: 'polkadot',
        origin_para_id: 1000,
        dest_para_id: 2000,
      },
      {
        message_hash: '0xhash2',
        unique_id: 'unique-2',
        relayed_block_timestamp: 456,
        status: 'Pending',
        from_chain: 'polkadot',
        origin_para_id: 1001,
        dest_para_id: 2001,
      },
    ]);
  });

  it('fetchLatestXcmList should throw when subscan responds with an error', async () => {
    const postMock = vi.fn().mockResolvedValue({
      data: {
        code: 1,
        message: 'subscan error',
        data: {
          list: [],
        },
      },
    });

    const createSpy = vi.spyOn(axios, 'create');

    createSpy.mockReturnValue({
      post: postMock,
    } as unknown as AxiosInstance);

    const client = new SubscanClient();

    await expect(
      client.fetchLatestXcmList({ ecosystem: 'Kusama' }),
    ).rejects.toThrow('subscan error');

    const [[defaultConfig]] = createSpy.mock.calls;
    expect(defaultConfig).toEqual({
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    expect(postMock).toHaveBeenCalledWith(
      'https://kusama.api.subscan.io/api/scan/xcm/list',
      {
        page: 0,
        row: 20,
      },
    );
  });
});
