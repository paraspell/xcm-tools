import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AssetClaimBuilder,
  Builder,
  SUBSTRATE_CHAINS,
  TAssetClaimOptionsBase,
  TPapiApi,
  TPapiSigner,
  TPapiTransaction,
  TSubstrateChain,
} from '@paraspell/sdk';

import { isValidWalletAddress } from '../utils.js';
import { handleXcmApiError } from '../utils/error-handler.js';
import { AssetClaimDto } from './dto/asset-claim.dto.js';

@Injectable()
export class AssetClaimService {
  async claimAssets({ from, currency, address, options }: AssetClaimDto) {
    const fromChain = from as TSubstrateChain | undefined;

    if (!fromChain) {
      throw new BadRequestException("You need to provide a 'from' parameter");
    }

    if (fromChain && !SUBSTRATE_CHAINS.includes(fromChain)) {
      throw new BadRequestException(
        `Chain ${from} is not valid. Check docs for valid chains.`,
      );
    }

    if (typeof address === 'string' && !isValidWalletAddress(address)) {
      throw new BadRequestException('Invalid wallet address.');
    }

    const hasOptions = options && Object.keys(options).length > 0;

    let builder:
      | AssetClaimBuilder<
          TPapiApi,
          TPapiTransaction,
          TPapiSigner,
          TAssetClaimOptionsBase
        >
      | undefined;
    try {
      builder = Builder(hasOptions ? options : undefined)
        .claimFrom(fromChain)
        .currency(currency)
        .address(address);

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
