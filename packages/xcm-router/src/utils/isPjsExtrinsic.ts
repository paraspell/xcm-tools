import type { Extrinsic } from '@paraspell/sdk-pjs';

import type { TExtrinsic } from '../types';

export function isPjsExtrinsic(tx: TExtrinsic): tx is Extrinsic {
  return (
    typeof tx === 'object' &&
    tx !== null &&
    'send' in tx &&
    typeof tx.send === 'function' &&
    'signAndSend' in tx &&
    typeof tx.signAndSend === 'function' &&
    'signAsync' in tx &&
    typeof tx.signAsync === 'function' &&
    'paymentInfo' in tx &&
    typeof tx.paymentInfo === 'function'
  );
}
