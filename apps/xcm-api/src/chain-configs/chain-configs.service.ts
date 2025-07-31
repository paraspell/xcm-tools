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
  CHAINS_WITH_RELAY_CHAINS,
  TChainDotKsmWithRelayChains,
  TChainPolkadotKusama,
  TChainWithRelayChains,
} from '@paraspell/sdk';

import { validateChain } from '../utils.js';

@Injectable()
export class ChainConfigsService {
  getChainNames() {
    return CHAINS_WITH_RELAY_CHAINS;
  }

  getParaId(chain: string) {
    validateChain(chain, { excludeEthereum: true });
    return getParaId(chain as TChainPolkadotKusama);
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
    validateChain(chain, { excludeEthereum: true, withRelayChains: true });
    return getChainProviders(chain as TChainDotKsmWithRelayChains);
  }

  hasDryRunSupport(chain: string) {
    validateChain(chain, { withRelayChains: true });
    return hasDryRunSupport(chain as TChainWithRelayChains);
  }
}
