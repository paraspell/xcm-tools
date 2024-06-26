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
  TSerializedApiCall,
  createApiInstanceForNode,
} from '@paraspell/sdk';
import { isValidWalletAddress } from '../utils.js';
import { XTransferDto } from './dto/XTransferDto.js';

@Injectable()
export class XTransferService {
  async generateXcmCall({
    from,
    to,
    amount,
    address,
    currency,
    xcmVersion,
  }: XTransferDto) {
    const fromNode = from as TNode | undefined;
    const toNode = to as TNode | undefined;

    if (!fromNode && !toNode) {
      throw new BadRequestException(
        "You need to provide either 'from' or 'to' parameters",
      );
    }

    if (fromNode && !NODE_NAMES.includes(fromNode)) {
      throw new BadRequestException(
        `Node ${from} is not valid. Check docs for valid nodes.`,
      );
    }

    if (typeof toNode === 'string' && toNode && !NODE_NAMES.includes(toNode)) {
      throw new BadRequestException(
        `Node ${to} is not valid. Check docs for valid nodes.`,
      );
    }

    if (fromNode && toNode && !currency) {
      throw new BadRequestException(`Currency should not be empty.`);
    }

    if (typeof address === 'string' && !isValidWalletAddress(address)) {
      throw new BadRequestException('Invalid wallet address.');
    }

    const api = await createApiInstanceForNode(fromNode ?? toNode);

    let builder: any = Builder(api);

    if (fromNode && toNode) {
      // Parachain to parachain
      builder = builder.from(fromNode).to(toNode).currency(currency);
    } else if (from) {
      // Parachain to relaychain
      builder = builder.from(fromNode);
    } else if (to) {
      // Relaychain to parachain
      builder = builder.to(toNode);
    }

    builder = builder.amount(amount).address(address);

    if (xcmVersion) {
      builder = builder.xcmVersion(xcmVersion);
    }

    let response: TSerializedApiCall;
    try {
      response = await builder.buildSerializedApiCall();
    } catch (e) {
      if (
        e instanceof InvalidCurrencyError ||
        e instanceof IncompatibleNodesError
      ) {
        throw new BadRequestException(e.message);
      }
      throw new InternalServerErrorException(e.message);
    } finally {
      if (api) api.disconnect();
    }
    return response;
  }
}
