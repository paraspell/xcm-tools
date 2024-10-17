import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  InvalidCurrencyError,
  NODES_WITH_RELAY_CHAINS,
  TMultiAsset,
  TNode,
} from '@paraspell/sdk';
import { isValidWalletAddress } from '../utils.js';
import { AssetClaimDto } from './dto/asset-claim.dto.js';
import { ApiPromise } from '@polkadot/api';
import { PolkadotClient } from 'polkadot-api';
import { TPapiTransaction } from '@paraspell/sdk/papi';

@Injectable()
export class AssetClaimService {
  async claimAssetsPjs(options: AssetClaimDto, hashEnabled = false) {
    return await this.claimAssets(options, hashEnabled);
  }

  async claimAssetsPapi(options: AssetClaimDto) {
    return await this.claimAssets(options, false, true);
  }

  private async claimAssets(
    { from, fungible, address }: AssetClaimDto,
    hashEnabled = false,
    usePapi = false,
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

    const Sdk = usePapi
      ? await import('@paraspell/sdk/papi')
      : await import('@paraspell/sdk');

    const api = await Sdk.createApiInstanceForNode(fromNode);

    try {
      const builder = Sdk.Builder(api as ApiPromise & PolkadotClient)
        .claimFrom(fromNode)
        .fungible(fungible as TMultiAsset[])
        .account(address);

      if (usePapi) {
        const tx = await builder.build();
        return (await (tx as TPapiTransaction).getEncodedData()).asHex();
      }

      return hashEnabled
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
      if ('disconnect' in api) await api.disconnect();
      else api.destroy();
    }
  }
}
