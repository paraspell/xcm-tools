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

  const modifiedOptions: TTransferOptionsModified = {
    ...options,
    exchange: dex.node,
    feeCalcAddress: determineFeeCalcAddress(injectorAddress, recipientAddress),
  };

  const { from, to, amount } = modifiedOptions;

  if (type === TransactionType.TO_EXCHANGE) {
    const originApi = await createApiInstanceForNode(
      from === 'Ethereum' ? 'AssetHubPolkadot' : from,
    );
    if (from === 'Ethereum' && assetHubAddress) {
      await transferFromEthereum(modifiedOptions);
      await transferToExchange(
        {
          ...modifiedOptions,
          from: 'AssetHubPolkadot',
        },
        originApi,
      );
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
          exchange: 'AssetHubPolkadot',
        },
        amount,
      );
    } else {
      await transferToDestination(modifiedOptions, amount, swapApi);
    }
  } else if (type === TransactionType.FROM_ETH) {
    await transferFromEthereum(modifiedOptions);
  } else if (type === TransactionType.TO_ETH && assetHubAddress) {
    await transferToEthereum(
      {
        ...modifiedOptions,
        exchange: 'AssetHubPolkadot',
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
      await transferToExchange(
        {
          ...modifiedOptions,
          from: 'AssetHubPolkadot',
        },
        originApi,
      );
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
        },
        amountOut,
        swapApi,
      );
      await delay(1000);
      await transferToEthereum(
        {
          ...modifiedOptions,
          exchange: 'AssetHubPolkadot',
        },
        amountOut,
      );
    } else {
      await transferToDestination(modifiedOptions, amountOut, swapApi);
    }
  }
};
