import { Injectable } from '@nestjs/common';
import {
  AssetClaimBuilder,
  Builder,
  TAssetClaimOptionsBase,
  TPapiApi,
  TPapiSigner,
  TPapiTransaction,
} from '@paraspell/sdk';
import { toHex } from 'polkadot-api/utils';

import { handleXcmApiError } from '../utils/error-handler.js';
import { AssetClaimDto } from './dto/asset-claim.dto.js';

@Injectable()
export class AssetClaimService {
  /**
   * @deprecated Asset claim functionality is deprecated and will be removed in v14.
   */
  async claimAssets({ from, currency, address, options }: AssetClaimDto) {
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
        .claimFrom(from)
        .currency(currency)
        .address(address);

      const tx = await builder.build();

      const encoded = await tx.getEncodedData();
      return toHex(encoded);
    } catch (e) {
      return handleXcmApiError(e);
    } finally {
      await builder?.disconnect();
    }
  }
}
