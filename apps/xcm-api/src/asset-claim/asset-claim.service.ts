import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AssetClaimBuilder,
  Builder,
  NODES_WITH_RELAY_CHAINS,
  TAssetClaimOptionsBase,
  TMultiAsset,
  TNodeDotKsmWithRelayChains,
  TPapiApi,
  TPapiTransaction,
} from '@paraspell/sdk';

import { isValidWalletAddress } from '../utils.js';
import { handleXcmApiError } from '../utils/error-handler.js';
import { AssetClaimDto } from './dto/asset-claim.dto.js';

@Injectable()
export class AssetClaimService {
  async claimAssets({ from, fungible, address, options }: AssetClaimDto) {
    const fromNode = from as TNodeDotKsmWithRelayChains | undefined;

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

    const hasOptions = options && Object.keys(options).length > 0;

    let builder:
      | AssetClaimBuilder<TPapiApi, TPapiTransaction, TAssetClaimOptionsBase>
      | undefined;
    try {
      builder = Builder(hasOptions ? options : undefined)
        .claimFrom(fromNode)
        .fungible(fungible as TMultiAsset[])
        .account(address);

      const tx = await builder.build();

      const encoded = await tx.getEncodedData();
      return encoded.asHex();
    } catch (e) {
      return handleXcmApiError(e);
    } finally {
      await builder?.disconnect();
    }
  }
}
