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
  TChain,
  TRelaychain,
  TSubstrateChain,
} from '@paraspell/sdk';

@Injectable()
export class ChainConfigsService {
  getChainNames() {
    return CHAINS;
  }

  getParaId(chain: TChain) {
    return getParaId(chain);
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

  getWsEndpoints(chain: TSubstrateChain) {
    return getChainProviders(chain);
  }

  hasDryRunSupport(chain: TSubstrateChain) {
    return hasDryRunSupport(chain);
  }
}
