/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  InvalidCurrencyError,
  NODES_WITH_RELAY_CHAINS_DOT_KSM,
  TNodeDotKsmWithRelayChains,
  getTransferInfo,
} from '@paraspell/sdk';
import { isValidWalletAddress } from '../utils.js';
import { TransferInfoDto } from './dto/transfer-info.dto.js';

const serializeJson = (param: any): any => {
  return JSON.stringify(param, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value,
  );
};

@Injectable()
export class TransferInfoService {
  async getTransferInfo({
    origin,
    destination,
    accountOrigin,
    accountDestination,
    currency,
    amount,
  }: TransferInfoDto) {
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

    let response;
    try {
      response = await getTransferInfo(
        originNode,
        destNode,
        accountOrigin,
        accountDestination,
        { symbol: currency },
        amount.toString(),
      );
    } catch (e) {
      if (e instanceof InvalidCurrencyError) {
        throw new BadRequestException(e.message);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      throw new InternalServerErrorException(e.message);
    }
    return serializeJson(response);
  }
}
