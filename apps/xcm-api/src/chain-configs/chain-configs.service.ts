import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CHAINS,
  getChainProviders,
  getParaId,
  getTChain,
  hasDryRunSupport,
  RELAYCHAINS,
  SUBSTRATE_CHAINS,
  TChain,
  TRelaychain,
  TSubstrateChain,
} from '@paraspell/sdk';

import { validateChain } from '../utils.js';

@Injectable()
export class ChainConfigsService {
  getChainNames() {
    return CHAINS;
  }

  getParaId(chain: string) {
    validateChain(chain, CHAINS);
    return getParaId(chain as TChain);
  }

  getChainByParaId(paraId: number, ecosystem: string | undefined) {
    if (!RELAYCHAINS.includes(ecosystem as TRelaychain)) {
      throw new BadRequestException('Invalid ecosystem provided.');
    }
    const chain = getTChain(paraId, ecosystem as TRelaychain);
    if (!chain) {
      throw new NotFoundException(
        `Chain with parachain id ${paraId} not found.`,
      );
    }
    return JSON.stringify(chain);
  }

  getWsEndpoints(chain: string) {
    validateChain(chain, SUBSTRATE_CHAINS);
    return getChainProviders(chain as TSubstrateChain);
  }

  hasDryRunSupport(chain: string) {
    validateChain(chain, SUBSTRATE_CHAINS);
    return hasDryRunSupport(chain as TSubstrateChain);
  }
}
