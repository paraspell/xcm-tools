import { BadRequestException, Injectable } from '@nestjs/common';
import {
  getNodeProviders,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
  TNodeDotKsmWithRelayChains,
} from '@paraspell/sdk';
import {
  EXCHANGE_NODES,
  RouterBuilder,
  TExchangeNode,
} from '@paraspell/xcm-router';

import { isValidWalletAddress } from '../utils.js';
import { handleXcmApiError } from '../utils/error-handler.js';
import { RouterBestAmountOutDto, RouterDto } from './dto/RouterDto.js';

const validateNodesAndExchange = (
  from: string,
  exchange: RouterDto['exchange'],
  to: string,
): {
  fromNode: TNodeDotKsmWithRelayChains;
  exchangeNode?: TExchangeNode | TExchangeNode[];
  toNode: TNodeDotKsmWithRelayChains;
} => {
  const fromNode = from as TNodeDotKsmWithRelayChains;
  const exchangeNode = exchange as TExchangeNode | TExchangeNode[];
  const toNode = to as TNodeDotKsmWithRelayChains;

  if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(fromNode)) {
    throw new BadRequestException(
      `Node ${from} is not valid. Check docs for valid nodes.`,
    );
  }

  const exchanges = exchangeNode
    ? ([] as TExchangeNode[]).concat(exchangeNode)
    : undefined;

  if (exchanges?.some((x) => !EXCHANGE_NODES.includes(x))) {
    throw new BadRequestException(
      `Exchange ${exchanges.toString()} is not valid. Check docs for valid exchanges.`,
    );
  }

  if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(toNode)) {
    throw new BadRequestException(
      `Node ${to} is not valid. Check docs for valid nodes.`,
    );
  }

  return { fromNode, exchangeNode, toNode };
};

@Injectable()
export class RouterService {
  async generateExtrinsics(options: RouterDto) {
    const {
      from,
      exchange,
      to,
      currencyFrom,
      currencyTo,
      amount,
      senderAddress,
      evmSenderAddress,
      recipientAddress,
      slippagePct = '1',
    } = options;

    const fromNode = from as TNodeDotKsmWithRelayChains;
    const exchangeNode = exchange as TExchangeNode;
    const toNode = to as TNodeDotKsmWithRelayChains;

    validateNodesAndExchange(from, exchange, to);

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
      const transactions = await RouterBuilder()
        .from(fromNode)
        .exchange(exchangeNode)
        .to(toNode)
        .currencyFrom(currencyFrom)
        .currencyTo(currencyTo)
        .amount(amount.toString())
        .senderAddress(senderAddress)
        .evmSenderAddress(evmSenderAddress)
        .recipientAddress(recipientAddress)
        .slippagePct(slippagePct)
        .buildTransactions();

      const response = transactions.map((transaction) => ({
        node: transaction.node,
        destinationNode: transaction.destinationNode,
        type: transaction.type,
        tx: transaction.tx,
        ...(transaction.type === 'SWAP' && {
          amountOut: transaction.amountOut,
        }),
        wsProviders: getNodeProviders(transaction.node),
      }));

      await Promise.all(transactions.map((item) => item.api.disconnect()));

      return response;
    } catch (e) {
      return handleXcmApiError(e);
    }
  }

  async getBestAmountOut(options: RouterBestAmountOutDto) {
    const { from, exchange, to, currencyFrom, currencyTo, amount } = options;

    const fromNode = from as TNodeDotKsmWithRelayChains;
    const exchangeNode = exchange as TExchangeNode;
    const toNode = to as TNodeDotKsmWithRelayChains;

    validateNodesAndExchange(from, exchange, to);

    try {
      return await RouterBuilder()
        .from(fromNode)
        .exchange(exchangeNode)
        .to(toNode)
        .currencyFrom(currencyFrom)
        .currencyTo(currencyTo)
        .amount(amount.toString())
        .getBestAmountOut();
    } catch (e) {
      return handleXcmApiError(e);
    }
  }
}
