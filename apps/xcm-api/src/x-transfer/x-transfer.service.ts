import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  Builder,
  IncompatibleNodesError,
  InvalidCurrencyError,
  NODE_NAMES,
  TNode,
  TTransferReturn,
  UseKeepAliveFinalBuilder,
  createApiInstanceForNode,
  determineRelayChain,
} from '@paraspell/sdk';
import { isValidWalletAddress } from '../utils.js';
import { XTransferDto } from './dto/XTransferDto.js';
import { BatchXTransferDto } from './dto/XTransferBatchDto.js';

@Injectable()
export class XTransferService {
  async generateXcmCall(
    { from, to, amount, address, currency, xcmVersion }: XTransferDto,
    hashEnabled = false,
  ) {
    const fromNode = from as TNode | undefined;
    const toNode = to as TNode | undefined;

    if (!fromNode && !toNode) {
      throw new BadRequestException(
        "You need to provide either 'from' or 'to' parameters",
      );
    }

    if (fromNode && !NODE_NAMES.includes(fromNode)) {
      throw new BadRequestException(
        `Node ${fromNode} is not valid. Check docs for valid nodes.`,
      );
    }

    if (typeof toNode === 'string' && toNode && !NODE_NAMES.includes(toNode)) {
      throw new BadRequestException(
        `Node ${toNode} is not valid. Check docs for valid nodes.`,
      );
    }

    if (fromNode && toNode && !currency) {
      throw new BadRequestException(`Currency should not be empty.`);
    }

    if (typeof address === 'string' && !isValidWalletAddress(address)) {
      throw new BadRequestException('Invalid wallet address.');
    }

    const node = fromNode ?? toNode;
    const api = await createApiInstanceForNode(node as TNode);

    const builder = Builder(api);

    let finalBuilder: UseKeepAliveFinalBuilder;

    if (fromNode && toNode && currency) {
      // Parachain to parachain
      finalBuilder = builder
        .from(fromNode)
        .to(toNode)
        .currency(currency)
        .amount(amount)
        .address(address);
    } else if (fromNode) {
      // Parachain to relaychain
      finalBuilder = builder.from(fromNode).amount(amount).address(address);
    } else {
      // Relaychain to parachain
      finalBuilder = builder
        .to(toNode as TNode)
        .amount(amount)
        .address(address);
    }

    if (xcmVersion) {
      finalBuilder = finalBuilder.xcmVersion(xcmVersion);
    }

    let response: TTransferReturn;
    try {
      response = hashEnabled
        ? await finalBuilder.build()
        : await finalBuilder.buildSerializedApiCall();
    } catch (e) {
      if (
        e instanceof InvalidCurrencyError ||
        e instanceof IncompatibleNodesError
      ) {
        console.log(e);
        throw new BadRequestException(e.message);
      }
      const error = e as Error;
      throw new InternalServerErrorException(error.message);
    } finally {
      if (api) await api.disconnect();
    }
    return response;
  }

  async generateBatchXcmCall(batchDto: BatchXTransferDto) {
    const { transfers, options } = batchDto;

    if (!transfers || transfers.length === 0) {
      throw new BadRequestException('Transfers array cannot be empty.');
    }

    const firstTransfer = transfers[0];
    const fromNode = firstTransfer.from as TNode | undefined;
    const toNode = firstTransfer.to as TNode | undefined;

    if (!fromNode && !toNode) {
      throw new BadRequestException(
        "You need to provide either 'from' or 'to' parameters.",
      );
    }

    if (toNode && typeof toNode === 'object') {
      throw new BadRequestException('Please provide ApiPromise instance.');
    }

    const sameFrom = transfers.every((transfer) => transfer.from === fromNode);

    if (!sameFrom) {
      throw new BadRequestException(
        'All transactions must have the same origin.',
      );
    }

    if (fromNode && !NODE_NAMES.includes(fromNode)) {
      throw new BadRequestException(
        `Node ${fromNode} is not valid. Check docs for valid nodes.`,
      );
    }

    if (toNode && !NODE_NAMES.includes(toNode)) {
      throw new BadRequestException(
        `Node ${toNode} is not valid. Check docs for valid nodes.`,
      );
    }

    const api = await createApiInstanceForNode(
      fromNode ?? determineRelayChain(toNode as TNode),
    );
    let builder = Builder(api);

    try {
      for (const transfer of transfers) {
        const transferFromNode = transfer.from as TNode | undefined;
        const transferToNode = transfer.to as TNode | undefined;

        if (
          transferToNode &&
          typeof transferToNode === 'string' &&
          !NODE_NAMES.includes(transferToNode)
        ) {
          throw new BadRequestException(
            `Node ${transferToNode} is not valid. Check docs for valid nodes.`,
          );
        }

        if (transferFromNode && transferToNode && !transfer.currency) {
          throw new BadRequestException('Currency should not be empty.');
        }

        if (
          typeof transfer.address === 'string' &&
          !isValidWalletAddress(transfer.address)
        ) {
          throw new BadRequestException('Invalid wallet address.');
        }

        let finalBuilder: UseKeepAliveFinalBuilder;

        if (transferFromNode && transferToNode && transfer.currency) {
          // Parachain to parachain
          finalBuilder = builder
            .from(transferFromNode)
            .to(transferToNode)
            .currency(transfer.currency)
            .amount(transfer.amount)
            .address(transfer.address);
        } else if (transferFromNode) {
          // Parachain to relaychain
          finalBuilder = builder
            .from(transferFromNode)
            .amount(transfer.amount)
            .address(transfer.address);
        } else {
          // Relaychain to parachain
          finalBuilder = builder
            .to(transferToNode as TNode)
            .amount(transfer.amount)
            .address(transfer.address);
        }

        if (transfer.xcmVersion) {
          finalBuilder = finalBuilder.xcmVersion(transfer.xcmVersion);
        }

        builder = finalBuilder.addToBatch();
      }
      return await builder.buildBatch(options ?? undefined);
    } catch (e) {
      if (
        e instanceof InvalidCurrencyError ||
        e instanceof IncompatibleNodesError ||
        e instanceof BadRequestException
      ) {
        console.error(e);
        throw new BadRequestException(e.message);
      }
      console.log(e);

      throw new InternalServerErrorException((e as Error).message);
    } finally {
      if (api) await api.disconnect();
    }
  }
}
