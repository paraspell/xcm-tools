import { type Extrinsic, Builder, type TAsset, type TCurrencyCore } from '@paraspell/sdk';
import { type ApiPromise } from '@polkadot/api';
import {
  type TExchangeNode,
  type TCommonTransferOptionsModified,
  type TTransferOptionsModified,
} from '../types';
import { validateRelayChainCurrency } from '../utils/utils';
import { submitTransaction } from '../utils/submitTransaction';
import { ethers } from 'ethers';
import { FALLBACK_FEE_CALC_ADDRESS } from '../consts/consts';
import { findAssetInExchangeBySymbol } from '../assets/assets';

export const buildToExchangeExtrinsic = async (
  api: ApiPromise,
  {
    from,
    exchangeNode: exchange,
    currencyFrom,
    assetFrom,
    amount,
    injectorAddress,
  }: TCommonTransferOptionsModified,
): Promise<Extrinsic> => {
  const builder = Builder(api);
  if (from === 'Polkadot' || from === 'Kusama') {
    return await builder.to(exchange).amount(amount).address(injectorAddress).build();
  }
  return await builder
    .from(from === 'Ethereum' ? 'AssetHubPolkadot' : from)
    .to(exchange)
    .currency(
      from === 'Ethereum'
        ? assetFrom?.symbol
          ? { symbol: assetFrom.symbol }
          : currencyFrom
        : currencyFrom,
    )
    .amount(amount)
    .address(injectorAddress)
    .build();
};

export const getCurrencyExchange = (
  exchange: TExchangeNode,
  currencyOrigin: TCurrencyCore,
  assetToOrigin: TAsset | undefined,
): TCurrencyCore => {
  if ('symbol' in currencyOrigin) return { symbol: currencyOrigin.symbol };
  const exchangeAsset = findAssetInExchangeBySymbol(exchange, assetToOrigin?.symbol ?? '');
  if (!exchangeAsset) {
    throw new Error('Currency symbol not found in exchange node asset map.');
  }
  return { id: exchangeAsset.id ?? '' };
};

export const buildFromExchangeExtrinsic = async (
  api: ApiPromise,
  {
    to,
    exchangeNode,
    exchange,
    currencyTo,
    assetTo,
    recipientAddress: address,
  }: TCommonTransferOptionsModified,
  amountOut: string,
  isToEth = false,
): Promise<Extrinsic> => {
  const builder = Builder(api);
  if (to === 'Polkadot' || to === 'Kusama') {
    return await builder.from(exchangeNode).amount(amountOut).address(address).build();
  }

  const currencyToExchange = getCurrencyExchange(exchange, currencyTo, assetTo);

  return await builder
    .from(exchangeNode)
    .to(to === 'Ethereum' && !isToEth ? 'AssetHubPolkadot' : to)
    .currency(currencyToExchange)
    .amount(amountOut)
    .address(address)
    .build();
};

export const submitSwap = async (
  api: ApiPromise,
  options: TTransferOptionsModified,
  swapTx: Extrinsic,
): Promise<string> => {
  const { signer, injectorAddress } = options;
  return await submitTransaction(api, swapTx, signer, injectorAddress);
};

export const submitTransferToExchange = async (
  api: ApiPromise,
  options: TTransferOptionsModified,
): Promise<string> => {
  const { from, currencyFrom, signer, injectorAddress, evmSigner, evmInjectorAddress } = options;
  validateRelayChainCurrency(from, currencyFrom);
  const tx = await buildToExchangeExtrinsic(api, options);

  return await submitTransaction(
    api,
    tx,
    evmSigner ?? signer,
    evmInjectorAddress ?? injectorAddress,
  );
};

export const submitTransferToDestination = async (
  api: ApiPromise,
  options: TTransferOptionsModified,
  amountOut: string,
  isToEth = false,
): Promise<string> => {
  const { to, currencyTo, signer, injectorAddress } = options;
  validateRelayChainCurrency(to, currencyTo);
  const tx = await buildFromExchangeExtrinsic(api, options, amountOut, isToEth);
  return await submitTransaction(api, tx, signer, injectorAddress);
};

export const determineFeeCalcAddress = (
  injectorAddress: string,
  recipientAddress: string,
): string => {
  if (!ethers.isAddress(injectorAddress)) {
    // Use wallet address for fee calculation
    return injectorAddress;
  }

  if (!ethers.isAddress(recipientAddress)) {
    // Use recipient address for fee calculation
    return recipientAddress;
  }

  // If both addresses are ethereum addresses, use fallback address for fee calculation
  return FALLBACK_FEE_CALC_ADDRESS;
};
