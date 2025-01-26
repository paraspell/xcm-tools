import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  InvalidCurrencyError,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
  TNodeDotKsmWithRelayChains,
} from '@paraspell/sdk';
import { RouterDto } from './dto/RouterDto.js';
import { isValidWalletAddress } from '../utils.js';
import {
  EXCHANGE_NODES,
  TExchangeNode,
  TransactionType,
  buildTransferExtrinsics,
} from '@paraspell/xcm-router';

@Injectable()
export class RouterService {
  async generateExtrinsics(options: RouterDto) {
    const {
      from,
      exchange,
      to,
      amount,
      injectorAddress,
      recipientAddress,
      slippagePct = '1',
      type,
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

    if (!isValidWalletAddress(injectorAddress)) {
      throw new BadRequestException('Invalid injector wallet address.');
    }

    if (!isValidWalletAddress(recipientAddress)) {
      throw new BadRequestException('Invalid recipient wallet address.');
    }

    try {
      const txs = await buildTransferExtrinsics({
        ...options,
        type: type ? TransactionType[type] : undefined,
        from: fromNode,
        exchange: exchangeNode,
        to: toNode,
        amount: amount.toString(),
        slippagePct,
      });

      return txs;
    } catch (e) {
      if (e instanceof InvalidCurrencyError) {
        throw new BadRequestException(e.message);
      }
      if (e instanceof Error) {
        throw new InternalServerErrorException(e.message);
      }
    }
  }
}
