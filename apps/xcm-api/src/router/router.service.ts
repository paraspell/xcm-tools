import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CHAINS,
  getChainProviders,
  SUBSTRATE_CHAINS,
  TChain,
  TSubstrateChain,
} from '@paraspell/sdk';
import {
  EXCHANGE_CHAINS,
  getExchangePairs,
  RouterBuilder,
  TExchangeChain,
  TExchangeInput,
} from '@paraspell/xcm-router';

import { isValidWalletAddress } from '../utils.js';
import { handleXcmApiError } from '../utils/error-handler.js';
import {
  ExchangePairsDto,
  RouterBestAmountOutDto,
  RouterDto,
} from './dto/RouterDto.js';

const validateChainsAndExchange = (
  from: RouterDto['from'],
  exchange: RouterDto['exchange'],
  to: RouterDto['to'],
): {
  fromChain?: TSubstrateChain;
  exchangeChain?: TExchangeInput;
  toChain?: TChain;
} => {
  const fromChain = from as TSubstrateChain;
  const exchangeChain = exchange as TExchangeInput;
  const toChain = to as TChain;

  if (fromChain && !SUBSTRATE_CHAINS.includes(fromChain)) {
    throw new BadRequestException(
      `Chain ${from} is not valid. Check docs for valid chains.`,
    );
  }

  const exchanges = exchangeChain
    ? ([] as TExchangeChain[]).concat(exchangeChain)
    : undefined;

  if (exchanges?.some((x) => !EXCHANGE_CHAINS.includes(x))) {
    throw new BadRequestException(
      `Exchange ${exchanges.toString()} is not valid. Check docs for valid exchanges.`,
    );
  }

  if (toChain && !CHAINS.includes(toChain)) {
    throw new BadRequestException(
      `Chain ${to} is not valid. Check docs for valid chains.`,
    );
  }

  return {
    fromChain: fromChain,
    exchangeChain: exchangeChain,
    toChain: toChain,
  };
};

@Injectable()
export class RouterService {
  async generateExtrinsics(input: RouterDto) {
    const {
      from,
      exchange,
      to,
      currencyFrom,
      currencyTo,
      feeAsset,
      amount,
      senderAddress,
      evmSenderAddress,
      recipientAddress,
      slippagePct = '1',
      options,
    } = input;

    const { fromChain, exchangeChain, toChain } = validateChainsAndExchange(
      from,
      exchange,
      to,
    );

    if (!isValidWalletAddress(senderAddress)) {
      throw new BadRequestException('Invalid sender wallet address.');
    }

    if (evmSenderAddress && !isValidWalletAddress(evmSenderAddress)) {
      throw new BadRequestException('Invalid EVM sender wallet address.');
    }

    if (!isValidWalletAddress(recipientAddress)) {
      throw new BadRequestException('Invalid recipient wallet address.');
    }

    try {
      const transactions = await RouterBuilder(options)
        .from(fromChain ?? undefined)
        .exchange(exchangeChain)
        .to(toChain ?? undefined)
        .currencyFrom(currencyFrom)
        .currencyTo(currencyTo)
        .feeAsset(feeAsset)
        .amount(amount.toString())
        .senderAddress(senderAddress)
        .evmSenderAddress(evmSenderAddress)
        .recipientAddress(recipientAddress)
        .slippagePct(slippagePct)
        .buildTransactions();

      const response = await Promise.all(
        transactions.map(async (transaction) => {
          const txData = await transaction.tx.getEncodedData();
          const txHash = txData.asHex();

          const resultForThisTransaction = {
            chain: transaction.chain,
            destinationChain: transaction.destinationChain,
            type: transaction.type,
            tx: txHash,
            ...(transaction.type === 'SWAP' && {
              amountOut: transaction.amountOut,
            }),
            wsProviders: getChainProviders(transaction.chain),
          };
          return resultForThisTransaction;
        }),
      );

      return response;
    } catch (e) {
      return handleXcmApiError(e);
    }
  }

  async getXcmFees(input: RouterDto) {
    const {
      from,
      exchange,
      to,
      currencyFrom,
      currencyTo,
      feeAsset,
      amount,
      senderAddress,
      evmSenderAddress,
      recipientAddress,
      slippagePct = '1',
      options,
    } = input;

    const fromChain = from as TSubstrateChain;
    const exchangeChain = exchange as TExchangeChain;
    const toChain = to as TChain;

    validateChainsAndExchange(from, exchange, to);

    if (!isValidWalletAddress(senderAddress)) {
      throw new BadRequestException('Invalid sender wallet address.');
    }

    if (evmSenderAddress && !isValidWalletAddress(evmSenderAddress)) {
      throw new BadRequestException('Invalid EVM sender wallet address.');
    }

    if (!isValidWalletAddress(recipientAddress)) {
      throw new BadRequestException('Invalid recipient wallet address.');
    }

    try {
      return await RouterBuilder(options)
        .from(fromChain)
        .exchange(exchangeChain)
        .to(toChain)
        .currencyFrom(currencyFrom)
        .currencyTo(currencyTo)
        .feeAsset(feeAsset)
        .amount(amount.toString())
        .senderAddress(senderAddress)
        .evmSenderAddress(evmSenderAddress)
        .recipientAddress(recipientAddress)
        .slippagePct(slippagePct)
        .getXcmFees();
    } catch (e) {
      return handleXcmApiError(e);
    }
  }

  async getBestAmountOut(input: RouterBestAmountOutDto) {
    const { from, exchange, to, currencyFrom, currencyTo, amount, options } =
      input;

    const fromChain = from as TSubstrateChain;
    const exchangeChain = exchange as TExchangeChain;
    const toChain = to as TChain;

    validateChainsAndExchange(from, exchange, to);

    try {
      return await RouterBuilder(options)
        .from(fromChain)
        .exchange(exchangeChain)
        .to(toChain)
        .currencyFrom(currencyFrom)
        .currencyTo(currencyTo)
        .amount(amount.toString())
        .getBestAmountOut();
    } catch (e) {
      return handleXcmApiError(e);
    }
  }

  async dryRun(input: RouterDto) {
    const {
      from,
      exchange,
      to,
      currencyFrom,
      currencyTo,
      feeAsset,
      amount,
      senderAddress,
      evmSenderAddress,
      recipientAddress,
      slippagePct = '1',
      options,
    } = input;

    const fromChain = from as TSubstrateChain;
    const exchangeChain = exchange as TExchangeChain;
    const toChain = to as TChain;

    validateChainsAndExchange(from, exchange, to);

    if (!isValidWalletAddress(senderAddress)) {
      throw new BadRequestException('Invalid sender wallet address.');
    }

    if (evmSenderAddress && !isValidWalletAddress(evmSenderAddress)) {
      throw new BadRequestException('Invalid EVM sender wallet address.');
    }

    if (!isValidWalletAddress(recipientAddress)) {
      throw new BadRequestException('Invalid recipient wallet address.');
    }

    try {
      return await RouterBuilder(options)
        .from(fromChain)
        .exchange(exchangeChain)
        .to(toChain)
        .currencyFrom(currencyFrom)
        .currencyTo(currencyTo)
        .feeAsset(feeAsset)
        .amount(amount.toString())
        .senderAddress(senderAddress)
        .evmSenderAddress(evmSenderAddress)
        .recipientAddress(recipientAddress)
        .slippagePct(slippagePct)
        .dryRun();
    } catch (e) {
      return handleXcmApiError(e);
    }
  }

  async getTransferableAmount(input: RouterDto) {
    const {
      from,
      exchange,
      to,
      currencyFrom,
      currencyTo,
      feeAsset,
      amount,
      senderAddress,
      evmSenderAddress,
      recipientAddress,
      slippagePct = '1',
      options,
    } = input;

    const fromChain = from as TSubstrateChain;
    const exchangeChain = exchange as TExchangeChain;
    const toChain = to as TChain;

    validateChainsAndExchange(from, exchange, to);

    if (!isValidWalletAddress(senderAddress)) {
      throw new BadRequestException('Invalid sender wallet address.');
    }

    if (evmSenderAddress && !isValidWalletAddress(evmSenderAddress)) {
      throw new BadRequestException('Invalid EVM sender wallet address.');
    }

    if (!isValidWalletAddress(recipientAddress)) {
      throw new BadRequestException('Invalid recipient wallet address.');
    }

    try {
      return await RouterBuilder(options)
        .from(fromChain)
        .exchange(exchangeChain)
        .to(toChain)
        .currencyFrom(currencyFrom)
        .currencyTo(currencyTo)
        .feeAsset(feeAsset)
        .amount(amount.toString())
        .senderAddress(senderAddress)
        .evmSenderAddress(evmSenderAddress)
        .recipientAddress(recipientAddress)
        .slippagePct(slippagePct)
        .getTransferableAmount();
    } catch (e) {
      return handleXcmApiError(e);
    }
  }

  async getMinTransferableAmount(input: RouterDto) {
    const {
      from,
      exchange,
      to,
      currencyFrom,
      currencyTo,
      feeAsset,
      amount,
      senderAddress,
      evmSenderAddress,
      recipientAddress,
      slippagePct = '1',
      options,
    } = input;

    const fromChain = from as TSubstrateChain;
    const exchangeChain = exchange as TExchangeChain;
    const toChain = to as TChain;

    validateChainsAndExchange(from, exchange, to);

    if (!isValidWalletAddress(senderAddress)) {
      throw new BadRequestException('Invalid sender wallet address.');
    }

    if (evmSenderAddress && !isValidWalletAddress(evmSenderAddress)) {
      throw new BadRequestException('Invalid EVM sender wallet address.');
    }

    if (!isValidWalletAddress(recipientAddress)) {
      throw new BadRequestException('Invalid recipient wallet address.');
    }

    try {
      return await RouterBuilder(options)
        .from(fromChain)
        .exchange(exchangeChain)
        .to(toChain)
        .currencyFrom(currencyFrom)
        .currencyTo(currencyTo)
        .feeAsset(feeAsset)
        .amount(amount.toString())
        .senderAddress(senderAddress)
        .evmSenderAddress(evmSenderAddress)
        .recipientAddress(recipientAddress)
        .slippagePct(slippagePct)
        .getMinTransferableAmount();
    } catch (e) {
      return handleXcmApiError(e);
    }
  }

  getExchangePairs(exchange: ExchangePairsDto['exchange']) {
    return getExchangePairs(exchange as TExchangeInput);
  }
}
