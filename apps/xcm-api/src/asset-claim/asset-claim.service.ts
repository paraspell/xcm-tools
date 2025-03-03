import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  AssetClaimBuilder,
  InvalidCurrencyError,
  NODES_WITH_RELAY_CHAINS,
  TAssetClaimOptionsBase,
  TMultiAsset,
  TNodeDotKsmWithRelayChains,
  TPapiApi,
  TPapiTransaction,
} from '@paraspell/sdk';
import { isValidWalletAddress } from '../utils.js';
import { AssetClaimDto } from './dto/asset-claim.dto.js';

@Injectable()
export class AssetClaimService {
  async claimAssets(
    { from, fungible, address }: AssetClaimDto,
    usePapi = false,
  ) {
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

    const Sdk = usePapi
      ? await import('@paraspell/sdk')
      : await import('@paraspell/sdk-pjs');

    let builder:
      | AssetClaimBuilder<TPapiApi, TPapiTransaction, TAssetClaimOptionsBase>
      | undefined;
    try {
      builder = Sdk.Builder()
        .claimFrom(fromNode)
        .fungible(fungible as TMultiAsset[])
        .account(address) as AssetClaimBuilder<
        TPapiApi,
        TPapiTransaction,
        TAssetClaimOptionsBase
      >;

      const tx = await builder.build();

      return usePapi ? (await tx.getEncodedData()).asHex() : tx;
    } catch (e) {
      if (e instanceof InvalidCurrencyError) {
        throw new BadRequestException(e.message);
      }
      if (e instanceof Error) {
        throw new InternalServerErrorException(e.message);
      }
    } finally {
      await builder?.disconnect();
    }
  }
}
