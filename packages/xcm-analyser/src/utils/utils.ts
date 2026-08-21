import { LocationSchema } from '../schema';
import type { Junction, ParsedLocation, TJunctionGlobalConsensus } from '../types';

const convertGlobalConsensusToReadable = (
  network: TJunctionGlobalConsensus['GlobalConsensus'],
): string => {
  if (typeof network === 'string') return network;
  if ('ByGenesis' in network) {
    return `ByGenesis(${network.ByGenesis})`;
  }

  if ('ByFork' in network) {
    const { blockNumber, blockHash } = network.ByFork;
    return `ByFork(blockNumber: ${blockNumber}, blockHash: ${blockHash})`;
  }

  if ('Ethereum' in network) {
    return `Ethereum(chainId: ${network.Ethereum.chainId})`;
  }

  const unitNetwork = Object.keys(network)[0];
  return unitNetwork.charAt(0).toUpperCase() + unitNetwork.slice(1);
};

export const convertJunctionToReadable = (junction: Junction): string => {
  if ('Parachain' in junction) {
    return `Parachain(${junction.Parachain})`;
  } else if ('AccountId32' in junction) {
    return `AccountId32(${junction.AccountId32.network}, ${junction.AccountId32.id})`;
  } else if ('AccountIndex64' in junction) {
    return `AccountIndex64(${junction.AccountIndex64.network}, ${junction.AccountIndex64.index})`;
  } else if ('AccountKey20' in junction) {
    return `AccountKey20(${junction.AccountKey20.network}, ${junction.AccountKey20.key})`;
  } else if ('PalletInstance' in junction) {
    return `PalletInstance(${junction.PalletInstance})`;
  } else if ('GeneralIndex' in junction) {
    return `GeneralIndex(${junction.GeneralIndex})`;
  } else if ('GeneralKey' in junction) {
    return `GeneralKey(${junction.GeneralKey.length}, ${junction.GeneralKey.data})`;
  } else if ('OnlyChild' in junction) {
    return `OnlyChild(${junction.OnlyChild})`;
  } else if ('Plurality' in junction) {
    return `Plurality(${junction.Plurality.id}, ${junction.Plurality.part})`;
  } else {
    return `GlobalConsensus(${convertGlobalConsensusToReadable(junction.GlobalConsensus)})`;
  }
};

export function findLocationInObject(obj: unknown): ParsedLocation | null {
  function hasSpecificKeys(value: unknown): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      'parents' in value &&
      'interior' in value
    );
  }

  function searchObject(value: unknown): ParsedLocation | null {
    if (hasSpecificKeys(value)) {
      return LocationSchema.parse(value);
    } else if (typeof value === 'object' && value !== null) {
      for (const key of Object.keys(value)) {
        const result = searchObject((value as Record<string, unknown>)[key]);
        if (result) return result;
      }
    }
    return null;
  }

  return searchObject(obj);
}
