import { describe, it, expect, vi } from 'vitest';
import type { ApiPromise } from '@polkadot/api';
import type { QueryableStorageMultiArg } from '@polkadot/api/types';
import { fetchCallMulti } from './useCallMulti';

describe('fetchCallMulti', () => {
  const mockApi = (isConnected: boolean, queryMultiFn?: unknown): ApiPromise =>
    ({
      isConnected,
      queryMulti: queryMultiFn,
    }) as unknown as ApiPromise;

  it('returns defaultValue if calls is falsy', async () => {
    const api = mockApi(true, vi.fn());
    const defaultValue = 'default';
    const result = await fetchCallMulti({
      api,
      calls: null,
      options: { defaultValue },
    });
    expect(result).toBe(defaultValue);
  });

  it('returns defaultValue if calls is an empty array', async () => {
    const api = mockApi(true, vi.fn());
    const defaultValue = 'default';
    const result = await fetchCallMulti({
      api,
      calls: [],
      options: { defaultValue },
    });
    expect(result).toBe(defaultValue);
  });

  it('returns defaultValue if api is not connected', async () => {
    const api = mockApi(false, vi.fn());
    const defaultValue = 'default';
    const result = await fetchCallMulti({
      api,
      calls: [['someCall', {}]] as unknown as Array<QueryableStorageMultiArg<'promise'>>,
      options: { defaultValue },
    });
    expect(result).toBe(defaultValue);
  });

  it('returns defaultValue if no filtered calls', async () => {
    const api = mockApi(true, vi.fn());
    const defaultValue = 'default';
    const calls = [
      [null, {}],
      [undefined, {}],
    ] as unknown as Array<QueryableStorageMultiArg<'promise'>>;

    const result = await fetchCallMulti({
      api,
      calls,
      options: { defaultValue },
    });
    expect(result).toBe(defaultValue);
  });

  it('calls api.queryMulti with filtered calls and returns result if transform is not defined', async () => {
    const queryMultiMock = vi.fn().mockResolvedValue(['result1', 'result2']);
    const api = mockApi(true, queryMultiMock);
    const calls: Array<QueryableStorageMultiArg<'promise'>> = [
      ['storageKey1', {}],
      [undefined, {}],
      ['storageKey2', {}],
    ] as unknown as Array<QueryableStorageMultiArg<'promise'>>;

    const result = await fetchCallMulti({
      api,
      calls,
    });

    expect(queryMultiMock).toHaveBeenCalledWith([
      ['storageKey1', {}],
      ['storageKey2', {}],
    ]);

    expect(result).toEqual(['result1', 'result2']);
  });

  it('applies transform function to returned values', async () => {
    const queryMultiMock = vi.fn().mockResolvedValue(['val1', 'val2']);
    const api = mockApi(true, queryMultiMock);
    const transformMock = vi.fn((values: unknown) => {
      if (Array.isArray(values)) {
        return values.join(', ');
      }
      return values;
    });

    const result = await fetchCallMulti({
      api,
      calls: [['something'], ['somethingElse']] as unknown as Array<
        QueryableStorageMultiArg<'promise'>
      >,
      options: {
        transform: transformMock,
      },
    });

    expect(transformMock).toHaveBeenCalledTimes(1);
    expect(transformMock).toHaveBeenCalledWith(['val1', 'val2'], api);
    expect(result).toBe('val1, val2');
  });

  it('returns defaultValue if an error is thrown in queryMulti', async () => {
    const queryMultiMock = vi.fn().mockRejectedValue(new Error('Some query error'));
    const api = mockApi(true, queryMultiMock);
    const defaultValue = 'defaultErrorValue';

    const result = await fetchCallMulti({
      api,
      calls: [['storageKey1', {}]] as unknown as Array<QueryableStorageMultiArg<'promise'>>,
      options: { defaultValue },
    });

    expect(result).toBe(defaultValue);
  });
});
