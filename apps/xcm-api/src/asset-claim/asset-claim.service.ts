import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  Builder,
  InvalidCurrencyError,
  NODE_NAMES,
  TMultiAsset,
  TNode,
  TSerializedApiCall,
  createApiInstanceForNode,
} from '@paraspell/sdk';
import { isValidWalletAddress } from '../utils.js';
import { AssetClaimDto } from './dto/asset-claim.dto.js';

@Injectable()
export class AssetClaimService {
  async claimAssets({ from, fungible, address }: AssetClaimDto) {
    const fromNode = from as TNode | undefined;

    if (!fromNode) {
      throw new BadRequestException(
        "You need to provide either 'from' or 'to' parameters",
      );
    }

    if (fromNode && !NODE_NAMES.includes(fromNode)) {
      throw new BadRequestException(
        `Node ${from} is not valid. Check docs for valid nodes.`,
      );
    }

    if (typeof address === 'string' && !isValidWalletAddress(address)) {
      throw new BadRequestException('Invalid wallet address.');
    }

    const api = await createApiInstanceForNode(fromNode);

    let response: TSerializedApiCall;
    try {
      response = await Builder(api)
        .claimFrom(fromNode)
        .fungible(fungible as TMultiAsset[])
        .account(address)
        .buildSerializedApiCall();
    } catch (e) {
      if (e instanceof InvalidCurrencyError) {
        throw new BadRequestException(e.message);
      }
      throw new InternalServerErrorException(e.message);
    } finally {
      if (api) api.disconnect();
    }
    return response;
  }
}
