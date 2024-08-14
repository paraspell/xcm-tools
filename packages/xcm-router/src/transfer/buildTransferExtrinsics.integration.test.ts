// Integration tests for buildTransferExtrinsics function

import { describe, it, expect } from 'vitest';
import { buildTransferExtrinsics } from './buildTransferExtrinsics';
import { MOCK_TRANSFER_OPTIONS } from '../utils/utils.test';
import { type TTransferOptions } from '../types';

describe('buildTransferExtrinsics - integration', () => {
  it('should build transfer extrinsics correctly', async () => {
    const options: TTransferOptions = {
      ...MOCK_TRANSFER_OPTIONS,
      exchange: 'BasiliskDex',
      from: 'Kusama',
      to: 'Robonomics',
      currencyFrom: 'KSM',
      currencyTo: 'XRT',
    };

    const result = await buildTransferExtrinsics(options);

    expect(result).toBeDefined();
    expect(result).toHaveLength(3);
  });
});
