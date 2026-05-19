import { BadRequestException } from '@nestjs/common';
import type {
  TChain,
  TCustomChainsMap,
  TDestination,
  TLocation,
  TSubstrateChain,
} from '@paraspell/sdk';
import { isChain, isSubstrateChain, isTLocation } from '@paraspell/sdk';

const isCustomChain = (
  chain: string,
  customChains: TCustomChainsMap | undefined,
): boolean =>
  customChains !== undefined &&
  Object.prototype.hasOwnProperty.call(customChains, chain) === true;

export const assertSubstrateChain: (
  chain: string,
  customChains: TCustomChainsMap | undefined,
) => asserts chain is TSubstrateChain = (chain, customChains) => {
  if (isSubstrateChain(chain)) return;
  if (isCustomChain(chain, customChains)) return;
  throw new BadRequestException(
    `Unknown chain '${chain}'. Must be one of SUBSTRATE_CHAINS or defined in options.customChains.`,
  );
};

export const assertChain: (
  chain: string,
  customChains: TCustomChainsMap | undefined,
) => asserts chain is TChain = (chain, customChains) => {
  if (isChain(chain)) return;
  if (isCustomChain(chain, customChains)) return;
  throw new BadRequestException(
    `Unknown chain '${chain}'. Must be one of CHAINS or defined in options.customChains.`,
  );
};

export const assertDestination: (
  destination: string | TLocation,
  customChains: TCustomChainsMap | undefined,
) => asserts destination is TDestination = (destination, customChains) => {
  if (isTLocation(destination)) return;
  if (isChain(destination)) return;
  if (isCustomChain(destination, customChains)) return;
  throw new BadRequestException(
    `Unknown destination '${destination}'. Must be a chain name, a location, or defined in options.customChains.`,
  );
};
