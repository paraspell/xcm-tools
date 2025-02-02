import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  getNodeProviders,
  InvalidCurrencyError,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
  TNodeDotKsmWithRelayChains,
} from '@paraspell/sdk';
import { RouterDto } from './dto/RouterDto.js';
import { isValidWalletAddress } from '../utils.js';
import {
  EXCHANGE_NODES,
  RouterBuilder,
  TExchangeNode,
} from '@paraspell/xcm-router';

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

    if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(fromNode)) {
      throw new BadRequestException(
        `Node ${from} is not valid. Check docs for valid nodes.`,
      );
    }

    if (exchange && !EXCHANGE_NODES.includes(exchangeNode)) {
      throw new BadRequestException(
        `Exchange ${exchange} is not valid. Check docs for valid exchanges.`,
      );
    }

    if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(toNode)) {
      throw new BadRequestException(
        `Node ${to} is not valid. Check docs for valid nodes.`,
      );
    }

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

      return transactions.map((transaction) => ({
        node: transaction.node,
        destinationNode: transaction.destinationNode,
        type: transaction.type,
        tx: transaction.tx,
        wsProviders: getNodeProviders(transaction.node),
      }));
    } catch (e) {
      if (e instanceof InvalidCurrencyError) {
        throw new BadRequestException(e.message);
      }
      if (e instanceof Error) {
        throw new InternalServerErrorException(e.message);
      }
      throw e;
    }
  }
}
