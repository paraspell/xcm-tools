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
} from '@paraspell/sdk';
import { isValidWalletAddress } from '../utils.js';
import { PatchedXTransferDto } from './dto/XTransferDto.js';

@Injectable()
export class XTransferService {
  async generateXcmCall(
    { from, to, amount, address, currency, xcmVersion }: PatchedXTransferDto,
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

    const api = await createApiInstanceForNode(fromNode ?? toNode);

    const builder = Builder(api);

    let finalBuilder: UseKeepAliveFinalBuilder;

    if (fromNode && toNode) {
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
    } else if (to) {
      // Relaychain to parachain
      finalBuilder = builder.to(toNode).amount(amount).address(address);
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
        throw new BadRequestException(e.message);
      }
      const error = e as Error;
      throw new InternalServerErrorException(error.message);
    } finally {
      if (api) await api.disconnect();
    }
    return response;
  }
}
