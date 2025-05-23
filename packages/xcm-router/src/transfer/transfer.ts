import { InvalidParameterError } from '@paraspell/sdk';

import { type TTransferOptions } from '../types';
import { buildTransactions } from './buildTransactions';
import { executeRouterPlan } from './executeRouterPlan';
import { prepareTransformedOptions } from './utils';
import { validateTransferOptions } from './utils/validateTransferOptions';

/**
 * This function allows users to send one type of token and receive a different one on the destination chain
 * in a one operation. It integrates with multiple exchanges like Acala, Basilisk, Bifrost, HydraDX, Interlay,
 * Karura, and Kintsugi, covering over 500 asset pools.
 *
 * **Example Usage:**
 * ```typescript
 * await transfer({
 *   from: 'Polkadot',
 *   to: 'Astar',
 *   currencyFrom: { symbol: 'DOT' },
 *   currencyTo: { symbol: 'ASTR' },
 *   amount: '1000000',
 *   slippagePct: '1',
 *   senderAddress: 'your_injector_address',
 *   recipientAddress: 'recipient_address',
 *   signer: 'your_signer',
 *   onStatusChange: (status) => {
 *     console.log(status);
 *   },
 * });
 * ```
 *
 * @param initialOptions - An object containing transfer details such as origin, destination, currencies, amount, addresses, and signers.
 * @returns A Promise that resolves when the transfer is complete.
 * @throws An error if required parameters are missing or invalid.
 */
export const transfer = async (initialOptions: TTransferOptions): Promise<void> => {
  const {
    exchange: exchangeNode,
    signer,
    evmSigner,
    senderAddress,
    evmSenderAddress,
    onStatusChange,
  } = initialOptions;

  validateTransferOptions(initialOptions);

  if (evmSigner !== undefined && evmSenderAddress === undefined) {
    throw new InvalidParameterError('evmSenderAddress is required when evmSigner is provided');
  }

  if (evmSenderAddress !== undefined && evmSigner === undefined) {
    throw new InvalidParameterError('evmSigner is required when evmSenderAddress is provided');
  }

  if (exchangeNode === undefined) {
    onStatusChange?.({
      type: 'SELECTING_EXCHANGE',
    });
  }

  const { dex, options } = await prepareTransformedOptions(initialOptions);

  const routerPlan = await buildTransactions(dex, options);

  await executeRouterPlan(routerPlan, {
    signer,
    senderAddress,
    destination: options.destination?.node,
    evmSigner,
    evmSenderAddress,
    onStatusChange,
  });
};
