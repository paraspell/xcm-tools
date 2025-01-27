import { createApiInstanceForNode } from '@paraspell/sdk-pjs';
import { RouterEventType, type TTransferOptions } from '../types';
import { prepareTransformedOptions } from './utils';
import { validateTransferOptions } from './utils/validateTransferOptions';
import { buildTransactions } from './buildTransactions';
import { executeRouterPlan } from './executeRouterPlan';

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
 *   injectorAddress: 'your_injector_address',
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
  const { from, exchange, signer, evmSigner, injectorAddress, evmInjectorAddress, onStatusChange } =
    initialOptions;

  validateTransferOptions(initialOptions);

  if (evmSigner !== undefined && evmInjectorAddress === undefined) {
    throw new Error('evmInjectorAddress is required when evmSigner is provided');
  }

  if (evmInjectorAddress !== undefined && evmSigner === undefined) {
    throw new Error('evmSigner is required when evmInjectorAddress is provided');
  }

  if (onStatusChange && exchange === undefined) {
    onStatusChange({
      type: RouterEventType.SELECTING_EXCHANGE,
    });
  }

  const { options, dex } = await prepareTransformedOptions(initialOptions);

  const originApi = await createApiInstanceForNode(from);
  const swapApi = await dex.createApiInstance();

  const routerPlan = await buildTransactions(originApi, swapApi, options);

  await executeRouterPlan(routerPlan, {
    signer,
    senderAddress: injectorAddress,
    evmSigner,
    evmSenderAddress: evmInjectorAddress,
    onStatusChange,
  });

  await originApi.disconnect();
  await swapApi.disconnect();
};
