import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  NODE_NAMES_DOT_KSM,
  TNodePolkadotKusama,
  buildEthTransferOptions,
} from '@paraspell/sdk';
import { isValidPolkadotAddress } from '../utils.js';
import { XTransferEthDto } from './dto/x-transfer-eth.dto.js';

@Injectable()
export class XTransferEthService {
  async generateEthCall({
    to,
    address,
    destAddress,
    currency,
  }: XTransferEthDto) {
    const toNode = to as TNodePolkadotKusama;

    if (!NODE_NAMES_DOT_KSM.includes(toNode)) {
      throw new BadRequestException(
        `Node ${toNode} is not valid. Check docs for valid nodes.`,
      );
    }

    if (!isValidPolkadotAddress(destAddress)) {
      throw new BadRequestException('Invalid wallet address.');
    }

    try {
      return await buildEthTransferOptions({
        to: toNode,
        address,
        destAddress,
        currency,
      });
    } catch (e) {
      if (e instanceof Error) {
        throw new InternalServerErrorException(e.message);
      }
    }
  }
}
