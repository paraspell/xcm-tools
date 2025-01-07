import type { TAsset, TCurrencyCoreV1 } from '@paraspell/sdk-pjs';
import { type Extrinsic, Builder } from '@paraspell/sdk-pjs';
import { type ApiPromise } from '@polkadot/api';
import type { TExchangeNode } from '../types';
import { type TCommonTransferOptionsModified, type TTransferOptionsModified } from '../types';
import { validateRelayChainCurrency } from '../utils/utils';
import { submitTransaction } from '../utils/submitTransaction';
import { ethers } from 'ethers';
import { FALLBACK_FEE_CALC_ADDRESS } from '../consts';
import { findAssetInExchangeBySymbol } from '../assets/assets';

export const buildToExchangeExtrinsic = (
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
  const currency =
    from === 'Ethereum'
      ? assetFrom?.symbol
        ? { symbol: assetFrom.symbol }
        : currencyFrom
      : currencyFrom;

  return Builder(api)
    .from(from === 'Ethereum' ? 'AssetHubPolkadot' : from)
    .to(exchange)
    .currency({
      ...currency,
      amount,
    })
    .address(injectorAddress)
    .build();
};

export const getCurrencyExchange = (
  exchange: TExchangeNode,
  currencyOrigin: TCurrencyCoreV1,
  assetToOrigin: TAsset | undefined,
): TCurrencyCoreV1 => {
  if ('symbol' in currencyOrigin) return { symbol: currencyOrigin.symbol };
  const exchangeAsset = findAssetInExchangeBySymbol(exchange, assetToOrigin?.symbol ?? '');
  if (!exchangeAsset) {
    throw new Error('Currency symbol not found in exchange node asset map.');
  }
  return { id: exchangeAsset.id ?? '' };
};

export const buildFromExchangeExtrinsic = (
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
  const currencyToExchange = getCurrencyExchange(exchange, currencyTo, assetTo);

  return Builder(api)
    .from(exchangeNode)
    .to(to === 'Ethereum' && !isToEth ? 'AssetHubPolkadot' : to)
    .currency({
      ...currencyToExchange,
      amount: amountOut,
    })
    .address(address)
    .build();
};

export const submitSwap = async (
  api: ApiPromise,
  options: TTransferOptionsModified,
  swapTx: Extrinsic,
): Promise<string> => {
  const { signer, injectorAddress } = options;
  return submitTransaction(api, swapTx, signer, injectorAddress);
};

export const submitTransferToExchange = async (
  api: ApiPromise,
  options: TTransferOptionsModified,
): Promise<string> => {
  const { from, currencyFrom, signer, injectorAddress, evmSigner, evmInjectorAddress } = options;
  validateRelayChainCurrency(from, currencyFrom);
  const tx = await buildToExchangeExtrinsic(api, options);

  return submitTransaction(api, tx, evmSigner ?? signer, evmInjectorAddress ?? injectorAddress);
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
  return submitTransaction(api, tx, signer, injectorAddress);
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
