import type { IPolkadotApi } from '@paraspell/sdk-core';

import type { TExtrinsic } from '../../types';
import { isPjsExtrinsic } from '../../utils';

const stripHeaderBytes = (hex: string, byteCount: number) => '0x' + hex.slice(2 + byteCount * 2);

export const convertTxToTarget = async <TApi, TRes, TSigner>(
  tx: TExtrinsic,
  api: IPolkadotApi<TApi, TRes, TSigner>,
): Promise<TRes> => {
  const isPjsTx = isPjsExtrinsic(tx);

  const hex = isPjsTx ? tx.toHex() : (await tx.getEncodedData()).asHex();

  if (isPjsTx && api.getType() === 'PAPI') {
    try {
      const hex2 = stripHeaderBytes(hex, 2);
      return await api.txFromHex(hex2);
    } catch (_err) {
      const hex3 = stripHeaderBytes(hex, 3);
      return await api.txFromHex(hex3);
    }
  }

  return api.txFromHex(hex);
};
