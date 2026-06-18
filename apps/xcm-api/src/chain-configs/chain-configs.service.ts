import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EVM_ORIGIN_CHAINS } from '@paraspell/evm';
import { EVM_ORIGIN_CHAINS as SB_ORIGIN_CHAINS } from '@paraspell/evm-snowbridge';
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
  getChains() {
    return CHAINS;
  }

  getEvmChains() {
    return [...SB_ORIGIN_CHAINS, ...EVM_ORIGIN_CHAINS];
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
