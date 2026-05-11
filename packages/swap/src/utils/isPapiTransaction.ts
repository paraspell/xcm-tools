import type { TPapiTransaction } from '@paraspell/sdk';

import type { TExtrinsic } from '../types';

export const isPapiTransaction = <TRes>(tx: TExtrinsic<TRes>): tx is TPapiTransaction =>
  typeof tx === 'object' &&
  tx !== null &&
  'getEncodedData' in tx &&
  typeof tx.getEncodedData === 'function' &&
  'signSubmitAndWatch' in tx &&
  typeof tx.signSubmitAndWatch === 'function';
