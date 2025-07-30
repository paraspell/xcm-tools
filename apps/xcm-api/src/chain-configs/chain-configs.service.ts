import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  getChainProviders,
  getParaId,
  getTChain,
  hasDryRunSupport,
  SUBSTRATE_CHAINS,
  CHAINS,
  TChain,
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
    if (ecosystem !== 'polkadot' && ecosystem !== 'kusama') {
      throw new BadRequestException(
        "Invalid ecosystem provided. Available options are 'polkadot' and 'kusama'.",
      );
    }
    const chain = getTChain(paraId, ecosystem);
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
