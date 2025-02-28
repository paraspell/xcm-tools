import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  InvalidCurrencyError,
  IVersionBuilder,
  NODES_WITH_RELAY_CHAINS,
  TMultiAsset,
  TNodeDotKsmWithRelayChains,
  TPapiApi,
} from '@paraspell/sdk';
import { isValidWalletAddress } from '../utils.js';
import { AssetClaimDto } from './dto/asset-claim.dto.js';
import { TPapiTransaction } from '@paraspell/sdk';
import { Extrinsic, TPjsApi } from '@paraspell/sdk-pjs';

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
      | IVersionBuilder<TPapiApi, TPapiTransaction>
      | IVersionBuilder<TPjsApi, Extrinsic>
      | undefined;
    try {
      builder = Sdk.Builder()
        .claimFrom(fromNode)
        .fungible(fungible as TMultiAsset[])
        .account(address);

      const tx = await builder.build();

      return usePapi
        ? (await (tx as TPapiTransaction).getEncodedData()).asHex()
        : tx;
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
