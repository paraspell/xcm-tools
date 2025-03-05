import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  getTransferInfo,
  InvalidCurrencyError,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
  TNodeDotKsmWithRelayChains,
} from '@paraspell/sdk';
import { isValidWalletAddress } from '../utils.js';
import { TransferInfoDto } from './dto/transfer-info.dto.js';

@Injectable()
export class TransferInfoService {
  async getTransferInfo({
    origin,
    destination,
    accountOrigin,
    accountDestination,
    currency,
  }: TransferInfoDto) {
    const originNode = origin as TNodeDotKsmWithRelayChains | undefined;
    const destNode = destination as TNodeDotKsmWithRelayChains | undefined;

    if (originNode && !NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(originNode)) {
      throw new BadRequestException(
        `Node ${originNode} is not valid. Check docs for valid nodes.`,
      );
    }

    if (destNode && !NODES_WITH_RELAY_CHAINS_DOT_KSM.includes(destNode)) {
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

    try {
      return await getTransferInfo({
        origin: originNode as TNodeDotKsmWithRelayChains,
        destination: destNode as TNodeDotKsmWithRelayChains,
        accountOrigin,
        accountDestination,
        currency,
      });
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
