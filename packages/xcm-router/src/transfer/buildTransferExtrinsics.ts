import { buildEthTransferOptions, createApiInstanceForNode, getNodeProvider } from '@paraspell/sdk';
import createDexNodeInstance from '../dexNodes/DexNodeFactory';
import {
  TransactionType,
  type TBuildTransferExtrinsicsOptions,
  type TBuildTransferExtrinsicsResult,
  type TCommonTransferOptionsModified,
} from '../types';
import { validateRelayChainCurrency, calculateTransactionFee } from '../utils/utils';
import { selectBestExchange } from './selectBestExchange';
import {
  buildFromExchangeExtrinsic,
  buildToExchangeExtrinsic,
  determineFeeCalcAddress,
} from './utils';
import { ethers } from 'ethers';

export const buildTransferExtrinsics = async (
  options: TBuildTransferExtrinsicsOptions,
): Promise<TBuildTransferExtrinsicsResult> => {
  const { injectorAddress, evmInjectorAddress, assetHubAddress, ethAddress, type } = options;
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

  if (options.from === 'Ethereum' && ethAddress === undefined) {
    throw new Error('Ethereum address is required when transferring from Ethereum');
  }

  const dex =
    options.exchange !== undefined
      ? createDexNodeInstance(options.exchange)
      : await selectBestExchange(options);

  const modifiedOptions: TCommonTransferOptionsModified = {
    ...options,
    exchange: dex.node,
    feeCalcAddress: determineFeeCalcAddress(options.injectorAddress, options.recipientAddress),
  };

  const { from, to, currencyFrom, currencyTo, amount, feeCalcAddress } = modifiedOptions;

  const originApi = await createApiInstanceForNode(from === 'Ethereum' ? 'AssetHubPolkadot' : from);
  validateRelayChainCurrency(from, currencyFrom);
  validateRelayChainCurrency(to, currencyTo);

  const transactions: TBuildTransferExtrinsicsResult = [];

  if (type === TransactionType.TO_EXCHANGE) {
    if (from === 'Ethereum' && assetHubAddress) {
      const fromEthereumTx = await buildEthTransferOptions({
        to: 'AssetHubPolkadot',
        amount: amount.toString(),
        address: ethAddress ?? '',
        destAddress: assetHubAddress,
        currency: currencyFrom,
      });
      transactions.push({
        node: 'Ethereum',
        tx: fromEthereumTx,
        type: 'ETH_TRANSFER',
        statusType: TransactionType.TO_EXCHANGE,
      });
    }
    const toExchangeTx = await buildToExchangeExtrinsic(originApi, modifiedOptions);
    transactions.push({
      node: from === 'Ethereum' ? 'AssetHubPolkadot' : from,
      tx: toExchangeTx,
      type: 'EXTRINSIC',
      statusType: TransactionType.TO_EXCHANGE,
    });
  } else if (type === TransactionType.SWAP) {
    const swapApi = await dex.createApiInstance();
    const toExchangeTx = await buildToExchangeExtrinsic(originApi, modifiedOptions);
    const toExchangeTransactionFee = await calculateTransactionFee(toExchangeTx, feeCalcAddress);
    const toDestTxForSwap = await buildFromExchangeExtrinsic(swapApi, modifiedOptions, amount);
    const toDestTransactionFee = await calculateTransactionFee(toDestTxForSwap, feeCalcAddress);
    const { tx: swapTx } = await dex.swapCurrency(
      swapApi,
      {
        ...modifiedOptions,
        feeCalcAddress,
      },
      toDestTransactionFee,
      toExchangeTransactionFee,
    );
    transactions.push({
      node: dex.node,
      tx: swapTx,
      type: 'EXTRINSIC',
      statusType: TransactionType.SWAP,
    });
  } else if (type === TransactionType.TO_DESTINATION) {
    if (to === 'Ethereum' && assetHubAddress) {
      const swapApi = await dex.createApiInstance();
      const toAssetHubTx = await buildFromExchangeExtrinsic(
        swapApi,
        {
          ...modifiedOptions,
          recipientAddress: assetHubAddress,
          to: 'AssetHubPolkadot',
        },
        amount,
      );
      transactions.push({
        node: dex.node,
        tx: toAssetHubTx,
        type: 'EXTRINSIC',
        statusType: TransactionType.TO_EXCHANGE,
      });
    }
    const assetHubApi = await createApiInstanceForNode('AssetHubPolkadot');
    const swapApi = await dex.createApiInstance();
    const toDestTx = await buildFromExchangeExtrinsic(
      to === 'Ethereum' ? assetHubApi : swapApi,
      {
        ...modifiedOptions,
        exchange: to === 'Ethereum' ? 'AssetHubPolkadot' : dex.node,
      },
      amount,
      to === 'Ethereum',
    );
    transactions.push({
      node: to === 'Ethereum' ? 'AssetHubPolkadot' : dex.node,
      tx: toDestTx,
      type: 'EXTRINSIC',
      statusType: TransactionType.TO_DESTINATION,
    });
  } else if (type === TransactionType.FROM_ETH && assetHubAddress) {
    const fromEthereumTx = await buildEthTransferOptions({
      to: 'AssetHubPolkadot',
      amount: amount.toString(),
      address: ethAddress ?? '',
      destAddress: assetHubAddress,
      currency: currencyFrom,
    });
    transactions.push({
      node: 'Ethereum',
      tx: fromEthereumTx,
      type: 'ETH_TRANSFER',
      statusType: TransactionType.TO_EXCHANGE,
    });
  } else if (type === TransactionType.TO_ETH && assetHubAddress) {
    const assetHubApi = await createApiInstanceForNode('AssetHubPolkadot');
    const toDestTx = await buildFromExchangeExtrinsic(
      assetHubApi,
      {
        ...modifiedOptions,
        exchange: 'AssetHubPolkadot',
      },
      amount,
      true,
    );
    transactions.push({
      node: 'AssetHubPolkadot',
      tx: toDestTx,
      type: 'EXTRINSIC',
      statusType: TransactionType.TO_DESTINATION,
    });
  } else {
    // TO_EXCHANGE
    if (from === 'Ethereum' && assetHubAddress) {
      const fromEthereumTx = await buildEthTransferOptions({
        to: 'AssetHubPolkadot',
        amount: amount.toString(),
        address: ethAddress ?? '',
        destAddress: assetHubAddress,
        currency: currencyFrom,
      });
      transactions.push({
        node: 'Ethereum',
        tx: fromEthereumTx,
        type: 'ETH_TRANSFER',
        statusType: TransactionType.TO_EXCHANGE,
      });
    }
    const toExchangeTx = await buildToExchangeExtrinsic(originApi, modifiedOptions);
    transactions.push({
      node: from === 'Ethereum' ? 'AssetHubPolkadot' : from,
      tx: toExchangeTx,
      type: 'EXTRINSIC',
      statusType: TransactionType.TO_EXCHANGE,
    });

    // SWAP

    const swapApi = await dex.createApiInstance();
    const toExchangeTransactionFee = await calculateTransactionFee(toExchangeTx, feeCalcAddress);
    const toDestTxForSwap = await buildFromExchangeExtrinsic(swapApi, modifiedOptions, amount);
    const toDestTransactionFee = await calculateTransactionFee(toDestTxForSwap, feeCalcAddress);

    const { amountOut, tx: swapTx } = await dex.swapCurrency(
      swapApi,
      {
        ...modifiedOptions,
        feeCalcAddress,
      },
      toDestTransactionFee,
      toExchangeTransactionFee,
    );
    transactions.push({
      node: dex.node,
      tx: swapTx,
      type: 'EXTRINSIC',
      statusType: TransactionType.SWAP,
    });

    // TO_DESTINATION

    if (to === 'Ethereum' && assetHubAddress) {
      const swapApi = await dex.createApiInstance();
      const toAssetHubTx = await buildFromExchangeExtrinsic(
        swapApi,
        {
          ...modifiedOptions,
          recipientAddress: assetHubAddress,
          to: 'AssetHubPolkadot',
        },
        amountOut,
      );
      transactions.push({
        node: dex.node,
        tx: toAssetHubTx,
        type: 'EXTRINSIC',
        statusType: TransactionType.TO_EXCHANGE,
      });
    }
    const assetHubApi = await createApiInstanceForNode('AssetHubPolkadot');
    const toDestTx = await buildFromExchangeExtrinsic(
      to === 'Ethereum' ? assetHubApi : swapApi,
      {
        ...modifiedOptions,
        exchange: to === 'Ethereum' ? 'AssetHubPolkadot' : dex.node,
      },
      amountOut,
      to === 'Ethereum',
    );
    transactions.push({
      node: to === 'Ethereum' ? 'AssetHubPolkadot' : dex.node,
      tx: toDestTx,
      type: 'EXTRINSIC',
      statusType: TransactionType.TO_DESTINATION,
    });

    await originApi.disconnect();
    await swapApi.disconnect();
  }

  const txsWithWsProviders = transactions.map((tx) => ({
    ...tx,
    wsProvider: getNodeProvider(tx.node),
  }));

  return txsWithWsProviders;
};
