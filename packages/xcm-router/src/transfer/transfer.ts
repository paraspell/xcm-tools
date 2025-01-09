import type { TPjsApi } from '@paraspell/sdk-pjs';
import { createApiInstanceForNode } from '@paraspell/sdk-pjs';
import type { TTransferOptionsModified } from '../types';
import { type TTransferOptions, TransactionType } from '../types';
import { delay } from '../utils/utils';
import { transferToExchange } from './transferToExchange';
import { swap } from './swap';
import { transferToDestination } from './transferToDestination';
import { prepareTransformedOptions } from './utils';
import { transferToEthereum } from './transferToEthereum';
import { transferFromEthereum } from './transferFromEthereum';
import { createSwapTx } from './createSwapTx';
import { validateTransferOptions } from './utils/validateTransferOptions';

const moveFundsFromOriginToExchange = async (
  originApi: TPjsApi,
  transformedOptions: TTransferOptionsModified,
) => {
  const { from, assetHubAddress, exchangeNode } = transformedOptions;

  if (from === 'Ethereum' && assetHubAddress) {
    await transferFromEthereum(transformedOptions);
    throw new Error(
      'Transferring Snowbridge assets from AssetHub to other parachains is not yet supported.',
    );
  } else if (from === exchangeNode) {
    // Assets are already on the exchange node. No action needed.
    return;
  } else {
    await transferToExchange(transformedOptions, originApi);
  }
};

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
 * @param options - An object containing transfer details such as origin, destination, currencies, amount, addresses, and signers.
 * @returns A Promise that resolves when the transfer is complete.
 * @throws An error if required parameters are missing or invalid.
 */
export const transfer = async (options: TTransferOptions): Promise<void> => {
  const { evmSigner, evmInjectorAddress, ethSigner, assetHubAddress, type } = options;

  validateTransferOptions(options);

  if (evmSigner !== undefined && evmInjectorAddress === undefined) {
    throw new Error('evmInjectorAddress is required when evmSigner is provided');
  }

  if (evmInjectorAddress !== undefined && evmSigner === undefined) {
    throw new Error('evmSigner is required when evmInjectorAddress is provided');
  }

  if ((options.from === 'Ethereum' || options.to === 'Ethereum') && ethSigner === undefined) {
    throw new Error('Eth signer is required when transferring to or from Ethereum');
  }

  const { options: transformedOptions, dex } = await prepareTransformedOptions(options);

  const { from, to, amount, exchangeNode } = transformedOptions;

  if (type === TransactionType.TO_EXCHANGE) {
    const originApi = await createApiInstanceForNode(
      from === 'Ethereum' ? 'AssetHubPolkadot' : from,
    );
    await moveFundsFromOriginToExchange(originApi, transformedOptions);
  } else if (type === TransactionType.SWAP) {
    const originApi = await createApiInstanceForNode(
      from === 'Ethereum' ? 'AssetHubPolkadot' : from,
    );
    const swapApi = await dex.createApiInstance();
    const { tx: swapTx } = await createSwapTx(originApi, swapApi, dex, transformedOptions);
    await swap(transformedOptions, swapTx, swapApi);
  } else if (type === TransactionType.TO_DESTINATION) {
    const swapApi = await dex.createApiInstance();
    if (to === 'Ethereum' && assetHubAddress) {
      await transferToDestination(
        {
          ...transformedOptions,
          to: 'AssetHubPolkadot',
        },
        amount,
        swapApi,
      );
      await delay(1000);
      await transferToEthereum(
        {
          ...transformedOptions,
          exchangeNode: 'AssetHubPolkadot',
        },
        amount,
      );
    } else if (to === exchangeNode) {
      // Exchange node is the destination. Assets are already on the destination
    } else {
      await transferToDestination(transformedOptions, amount, swapApi);
    }
  } else if (type === TransactionType.FROM_ETH) {
    await transferFromEthereum(transformedOptions);
  } else if (type === TransactionType.TO_ETH && assetHubAddress) {
    await transferToEthereum(
      {
        ...transformedOptions,
        exchangeNode: 'AssetHubPolkadot',
      },
      amount,
    );
  } else {
    const originApi = await createApiInstanceForNode(
      from === 'Ethereum' ? 'AssetHubPolkadot' : from,
    );
    const swapApi = await dex.createApiInstance();
    const { tx: swapTx, amountOut } = await createSwapTx(
      originApi,
      swapApi,
      dex,
      transformedOptions,
    );

    await moveFundsFromOriginToExchange(originApi, transformedOptions);

    await delay(1000);
    await swap(transformedOptions, swapTx, swapApi);
    await delay(1000);

    if (to === 'Ethereum' && assetHubAddress) {
      await transferToDestination(
        {
          ...transformedOptions,
          to: 'AssetHubPolkadot',
          recipientAddress: assetHubAddress,
        },
        amountOut,
        swapApi,
      );
      await delay(1000);
      await transferToEthereum(
        {
          ...transformedOptions,
          exchangeNode: 'AssetHubPolkadot',
        },
        amountOut,
      );
    } else if (to === exchangeNode) {
      // Assets already on the destination
    } else {
      await transferToDestination(transformedOptions, amountOut, swapApi);
    }
    await originApi.disconnect();
    await swapApi.disconnect();
  }
};
