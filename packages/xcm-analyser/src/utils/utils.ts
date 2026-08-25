import { LocationSchema } from '../schema';
import type { Junction, ParsedLocation, TJunctionPlurality, TNetworkId } from '../types';

const convertNetworkToReadable = (network: TNetworkId): string => {
  if (network === null || typeof network === 'string') return String(network);
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

const convertBodyIdToReadable = (id: TJunctionPlurality['Plurality']['id']): string => {
  if (id === null || typeof id === 'string') return String(id);
  if ('Moniker' in id) return `Moniker(${id.Moniker})`;
  return `Index(${id.Index})`;
};

const convertBodyPartToReadable = (part: TJunctionPlurality['Plurality']['part']): string => {
  if (part === null || typeof part === 'string') return String(part);
  if ('Members' in part) return `Members(count: ${part.Members.count})`;

  if ('Fraction' in part) {
    const { nom, denom } = part.Fraction;
    return `Fraction(nom: ${nom}, denom: ${denom})`;
  }

  if ('AtLeastProportion' in part) {
    const { nom, denom } = part.AtLeastProportion;
    return `AtLeastProportion(nom: ${nom}, denom: ${denom})`;
  }

  const { nom, denom } = part.MoreThanProportion;
  return `MoreThanProportion(nom: ${nom}, denom: ${denom})`;
};

export const convertJunctionToReadable = (junction: Junction): string => {
  if ('Parachain' in junction) {
    return `Parachain(${junction.Parachain})`;
  } else if ('AccountId32' in junction) {
    const { network, id } = junction.AccountId32;
    return `AccountId32(${convertNetworkToReadable(network)}, ${id})`;
  } else if ('AccountIndex64' in junction) {
    const { network, index } = junction.AccountIndex64;
    return `AccountIndex64(${convertNetworkToReadable(network)}, ${index})`;
  } else if ('AccountKey20' in junction) {
    const { network, key } = junction.AccountKey20;
    return `AccountKey20(${convertNetworkToReadable(network)}, ${key})`;
  } else if ('PalletInstance' in junction) {
    return `PalletInstance(${junction.PalletInstance})`;
  } else if ('GeneralIndex' in junction) {
    return `GeneralIndex(${junction.GeneralIndex})`;
  } else if ('GeneralKey' in junction) {
    return `GeneralKey(${junction.GeneralKey.length}, ${junction.GeneralKey.data})`;
  } else if ('OnlyChild' in junction) {
    return junction.OnlyChild === null ? 'OnlyChild' : `OnlyChild(${junction.OnlyChild})`;
  } else if ('Plurality' in junction) {
    const { id, part } = junction.Plurality;
    return `Plurality(${convertBodyIdToReadable(id)}, ${convertBodyPartToReadable(part)})`;
  } else {
    return `GlobalConsensus(${convertNetworkToReadable(junction.GlobalConsensus)})`;
  }
};

export function findLocationsInObject(obj: unknown): ParsedLocation[] {
  function hasSpecificKeys(value: unknown): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      'parents' in value &&
      'interior' in value
    );
  }

  const locations: ParsedLocation[] = [];

  function searchObject(value: unknown): void {
    if (hasSpecificKeys(value)) {
      locations.push(LocationSchema.parse(value));
    } else if (typeof value === 'object' && value !== null) {
      for (const item of Object.values(value)) {
        searchObject(item);
      }
    }
  }

  searchObject(obj);
  return locations;
}
