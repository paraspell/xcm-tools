import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  InvalidCurrencyError,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
  TNodeDotKsmWithRelayChains,
  TTransferInfo,
  getTransferInfo,
} from '@paraspell/sdk';
import { isValidWalletAddress } from '../utils.js';
import { PatchedTransferInfoDto } from './dto/transfer-info.dto.js';

@Injectable()
export class TransferInfoService {
  async getTransferInfo({
    origin,
    destination,
    accountOrigin,
    accountDestination,
    currency,
    amount,
  }: PatchedTransferInfoDto) {
    const originNode = origin as TNodeDotKsmWithRelayChains | undefined;
    const destNode = destination as TNodeDotKsmWithRelayChains | undefined;

    if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(originNode)) {
      throw new BadRequestException(
        `Node ${originNode} is not valid. Check docs for valid nodes.`,
      );
    }

    if (!NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(destNode)) {
      throw new BadRequestException(
        `Node ${destNode} is not valid. Check docs for valid nodes.`,
      );
    }

    if (!isValidWalletAddress(accountOrigin)) {
      throw new BadRequestException('Invalid origin wallet address.');
    }

    if (!isValidWalletAddress(accountDestination)) {
      throw new BadRequestException('Invalid destination wallet address.');
    }

    let response: TTransferInfo;
    try {
      response = await getTransferInfo(
        originNode,
        destNode,
        accountOrigin,
        accountDestination,
        currency,
        amount.toString(),
      );
    } catch (e) {
      if (e instanceof InvalidCurrencyError) {
        throw new BadRequestException(e.message);
      }
      if (e instanceof Error) {
        throw new InternalServerErrorException(e.message);
      }
    }
    return response;
  }
}
