import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  Builder,
  InvalidCurrencyError,
  NODES_WITH_RELAY_CHAINS,
  TMultiAsset,
  TNode,
  TTransferReturn,
  createApiInstanceForNode,
} from '@paraspell/sdk';
import { isValidWalletAddress } from '../utils.js';
import { AssetClaimDto } from './dto/asset-claim.dto.js';

@Injectable()
export class AssetClaimService {
  async claimAssets(
    { from, fungible, address }: AssetClaimDto,
    hashEnabled = false,
  ) {
    const fromNode = from as TNode | undefined;

    if (!fromNode) {
      throw new BadRequestException("You need to provide a 'from' parameter");
    }

    if (fromNode && !NODES_WITH_RELAY_CHAINS.includes(fromNode)) {
      throw new BadRequestException(
        `Node ${from} is not valid. Check docs for valid nodes.`,
      );
    }

    if (typeof address === 'string' && !isValidWalletAddress(address)) {
      throw new BadRequestException('Invalid wallet address.');
    }

    const api = await createApiInstanceForNode(fromNode);

    let response: TTransferReturn;
    try {
      const builder = Builder(api)
        .claimFrom(fromNode)
        .fungible(fungible as TMultiAsset[])
        .account(address);
      response = hashEnabled
        ? await builder.build()
        : await builder.buildSerializedApiCall();
    } catch (e) {
      if (e instanceof InvalidCurrencyError) {
        throw new BadRequestException(e.message);
      }
      if (e instanceof Error) {
        throw new InternalServerErrorException(e.message);
      }
    } finally {
      if (api) await api.disconnect();
    }
    return response;
  }
}
