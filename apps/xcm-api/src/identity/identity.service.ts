import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  createApiInstanceForNode,
  createXcmIdentityCall,
} from '@paraspell/sdk';

import { CreateIdentityDto } from './dto/identity.dto.js';

@Injectable()
export class IdentityService {
  async createIdentityCall({
    from,
    xcmFee,
    regIndex,
    maxRegistrarFee,
    identity,
  }: CreateIdentityDto) {
    const SUPPORTED_NODES = [
      'AssetHubPolkadot',
      'AssetHubKusama',
      'Polkadot',
      'Kusama',
    ] as const;

    const fromNode = from as (typeof SUPPORTED_NODES)[number];

    if (fromNode && !SUPPORTED_NODES.includes(fromNode)) {
      throw new BadRequestException(
        `Node ${from} is not valid. Check docs for valid nodes.`,
      );
    }

    const api = await createApiInstanceForNode(fromNode);

    try {
      const tx = await createXcmIdentityCall({
        api,
        from: fromNode,
        xcmFee: xcmFee ? BigInt(xcmFee) : undefined,
        regIndex: Number(regIndex),
        maxRegistrarFee: BigInt(maxRegistrarFee),
        identity,
      });

      const encoded = await tx.getEncodedData();
      return encoded.asHex();
    } catch (e) {
      if (e instanceof Error) {
        throw new InternalServerErrorException(e.message);
      }
    }
  }
}
