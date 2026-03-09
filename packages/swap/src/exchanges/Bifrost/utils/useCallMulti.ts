import type { ApiPromise } from '@polkadot/api';
import type { QueryableStorageMultiArg } from '@polkadot/api/types';

type CallOptions<T> = {
  defaultValue?: T;
  transform?: (value: unknown, api: ApiPromise) => T;
};

type UseCallMultiOptions<T> = {
  api: ApiPromise;
  calls?: Array<QueryableStorageMultiArg<'promise'>> | null | false;
  options?: CallOptions<T>;
};

export const fetchCallMulti = async <T>({
  api,
  calls,
  options = {},
}: UseCallMultiOptions<T>): Promise<T> => {
  if (!calls || calls.length === 0 || !api.isConnected) {
    return options.defaultValue as T;
  }

  const included = calls.map((c) => !!c && (!Array.isArray(c) || !!c[0]));
  const filtered = calls.filter((_, index) => included[index]);

  if (filtered.length > 0) {
    try {
      const values = await api.queryMulti(filtered);
      const transformedValues = options.transform ? options.transform(values, api) : values;

      return transformedValues as T;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return options.defaultValue as T;
    }
  } else {
    return options.defaultValue as T;
  }
};
