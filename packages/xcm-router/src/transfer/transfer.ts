import { createApiInstanceForNode } from '@paraspell/sdk';
import createDexNodeInstance from '../dexNodes/DexNodeFactory';
import {
  type TTransferOptionsModified,
  type TTransferOptions,
  TransactionType,
  TransactionStatus,
} from '../types';
import { delay, maybeUpdateTransferStatus } from '../utils/utils';
import { transferToExchange } from './transferToExchange';
import { swap, createSwapExtrinsic } from './swap';
import { transferToDestination } from './transferToDestination';
import { selectBestExchange } from './selectBestExchange';
import { determineFeeCalcAddress } from './utils';
import { ethers } from 'ethers';
import { transferToEthereum } from './transferToEthereum';
import { transferFromEthereum } from './transferFromEthereum';
import { findAssetFrom, findAssetTo } from '../assets/assets';

export const transfer = async (options: TTransferOptions): Promise<void> => {
  const {
    evmSigner,
    evmInjectorAddress,
    ethSigner,
    injectorAddress,
    onStatusChange,
    exchange,
    recipientAddress,
    assetHubAddress,
    type,
  } = options;

  if (evmSigner !== undefined && evmInjectorAddress === undefined) {
    throw new Error('evmInjectorAddress is required when evmSigner is provided');
  }

  if (evmInjectorAddress !== undefined && evmSigner === undefined) {
    throw new Error('evmSigner is required when evmInjectorAddress is provided');
  }

  if (evmInjectorAddress !== undefined && !ethers.isAddress(evmInjectorAddress)) {
    throw new Error('Evm injector address is not a valid Ethereum address');
  }

  if (ethers.isAddress(injectorAddress)) {
    throw new Error(
      'Injector address cannot be an Ethereum address. Please use an Evm injector address instead.',
    );
  }

  if ((options.from === 'Ethereum' || options.to === 'Ethereum') && assetHubAddress === undefined) {
    throw new Error('AssetHub address is required when transferring to or from Ethereum');
  }

  if ((options.from === 'Ethereum' || options.to === 'Ethereum') && ethSigner === undefined) {
    throw new Error('Eth signer is required when transferring to or from Ethereum');
  }

  maybeUpdateTransferStatus(onStatusChange, {
    type: TransactionType.TO_EXCHANGE,
    status: TransactionStatus.IN_PROGRESS,
    isAutoSelectingExchange: exchange === undefined,
  });

  const dex =
    exchange !== undefined ? createDexNodeInstance(exchange) : await selectBestExchange(options);

  maybeUpdateTransferStatus(onStatusChange, {
    type: TransactionType.TO_EXCHANGE,
    status: TransactionStatus.IN_PROGRESS,
    isAutoSelectingExchange: false,
  });

  const assetFrom = findAssetFrom(options.from, dex.exchangeNode, options.currencyFrom);

  if (!assetFrom && 'id' in options.currencyFrom) {
    throw new Error(
      `Currency from ${JSON.stringify(options.currencyFrom)} not found in ${options.from}.`,
    );
  }

  const assetTo = findAssetTo(
    dex.exchangeNode,
    options.from,
    options.to,
    options.currencyTo,
    exchange === undefined,
  );

  if (!assetTo && 'id' in options.currencyTo) {
    throw new Error(
      `Currency to ${JSON.stringify(options.currencyTo)} not found in ${options.from}.`,
    );
  }

  const modifiedOptions: TTransferOptionsModified = {
    ...options,
    exchangeNode: dex.node,
    exchange: dex.exchangeNode,
    assetFrom,
    assetTo,
    feeCalcAddress: determineFeeCalcAddress(injectorAddress, recipientAddress),
  };

  const { from, to, amount } = modifiedOptions;

  if (type === TransactionType.TO_EXCHANGE) {
    const originApi = await createApiInstanceForNode(
      from === 'Ethereum' ? 'AssetHubPolkadot' : from,
    );
    if (from === 'Ethereum' && assetHubAddress) {
      await transferFromEthereum(modifiedOptions);
      throw new Error(
        'Transfering Snowbridge assets from AssetHub to other parachains is not yet supported.',
      );
    } else if (from === dex.node) {
      console.log('Assets are already on the exchange');
    } else {
      await transferToExchange(modifiedOptions, originApi);
    }
  } else if (type === TransactionType.SWAP) {
    const originApi = await createApiInstanceForNode(
      from === 'Ethereum' ? 'AssetHubPolkadot' : from,
    );
    const swapApi = await dex.createApiInstance();
    const { tx: swapTx } = await createSwapExtrinsic(originApi, swapApi, dex, modifiedOptions);
    await swap(modifiedOptions, swapTx, swapApi);
  } else if (type === TransactionType.TO_DESTINATION) {
    const swapApi = await dex.createApiInstance();
    if (to === 'Ethereum' && assetHubAddress) {
      await transferToDestination(
        {
          ...modifiedOptions,
          to: 'AssetHubPolkadot',
        },
        amount,
        swapApi,
      );
      await delay(1000);
      await transferToEthereum(
        {
          ...modifiedOptions,
          exchangeNode: 'AssetHubPolkadot',
        },
        amount,
      );
    } else if (to === dex.node) {
      console.log('Exchange node is the destination. Assets are already on the destination');
    } else {
      await transferToDestination(modifiedOptions, amount, swapApi);
    }
  } else if (type === TransactionType.FROM_ETH) {
    await transferFromEthereum(modifiedOptions);
  } else if (type === TransactionType.TO_ETH && assetHubAddress) {
    await transferToEthereum(
      {
        ...modifiedOptions,
        exchangeNode: 'AssetHubPolkadot',
      },
      amount,
    );
  } else {
    const originApi = await createApiInstanceForNode(
      from === 'Ethereum' ? 'AssetHubPolkadot' : from,
    );
    const swapApi = await dex.createApiInstance();
    const { tx: swapTx, amountOut } = await createSwapExtrinsic(
      originApi,
      swapApi,
      dex,
      modifiedOptions,
    );

    if (from === 'Ethereum' && assetHubAddress) {
      await transferFromEthereum(modifiedOptions);
      throw new Error(
        'Transfering Snowbridge assets from AssetHub to other parachains is not yet supported.',
      );
    } else if (from === dex.node) {
      console.log('Assets are already on the exchange');
    } else {
      await transferToExchange(modifiedOptions, originApi);
    }

    await delay(1000);
    await swap(modifiedOptions, swapTx, swapApi);
    await delay(1000);

    if (to === 'Ethereum' && assetHubAddress) {
      await transferToDestination(
        {
          ...modifiedOptions,
          to: 'AssetHubPolkadot',
          recipientAddress: assetHubAddress,
        },
        amountOut,
        swapApi,
      );
      await delay(1000);
      await transferToEthereum(
        {
          ...modifiedOptions,
          exchangeNode: 'AssetHubPolkadot',
        },
        amountOut,
      );
    } else if (to === dex.node) {
      console.log('Exchange node is the destination. Assets are already on the destination');
    } else {
      await transferToDestination(modifiedOptions, amountOut, swapApi);
    }
    await originApi.disconnect();
    await swapApi.disconnect();
  }
};
