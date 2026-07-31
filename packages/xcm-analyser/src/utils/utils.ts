import { LocationSchema } from '../schema';
import type {
  Junction,
  Location,
  TJunctionAccountId32,
  TJunctionAccountIndex64,
  TJunctionAccountKey20,
  TJunctionGeneralKey,
  TJunctionPlurality,
} from '../types';

export const convertJunctionToReadable = (junctionOriginal: Junction): string | never => {
  const junction = Object.fromEntries(
    Object.entries(junctionOriginal).map(([k, v]) => [k.toLowerCase(), v]),
  );

  const formatNetwork = (network: unknown): string => {
    if (network === null || network === undefined) {
      return String(network);
    }

    if (typeof network === 'string' || typeof network === 'number' || typeof network === 'boolean') {
      return String(network);
    }

    if (Array.isArray(network)) {
      return `[${network.map((item) => formatNetwork(item)).join(', ')}]`;
    }

    if (typeof network === 'object') {
      const entries = Object.entries(network as Record<string, unknown>);
      if (entries.length === 1) {
        const [variant, value] = entries[0];
        return `${variant}(${formatNetwork(value)})`;
      }

      return `{${entries
        .map(([key, value]) => `${key}: ${formatNetwork(value)}`)
        .join(', ')}}`;
    }

    return String(network);
  };

  if ('parachain' in junction) {
    return `Parachain(${junction.parachain})`;
  } else if ('accountid32' in junction) {
    const junct = junction.accountid32 as TJunctionAccountId32['AccountId32'];
    return `AccountId32(${formatNetwork(junct.network)}, ${junct.id})`;
  } else if ('accountindex64' in junction) {
    const junct = junction.accountindex64 as TJunctionAccountIndex64['AccountIndex64'];
    return `AccountIndex64(${formatNetwork(junct.network)}, ${junct.index})`;
  } else if ('accountkey20' in junction) {
    const junct = junction.accountkey20 as TJunctionAccountKey20['AccountKey20'];
    return `AccountKey20(${formatNetwork(junct.network)}, ${junct.key})`;
  } else if ('palletinstance' in junction) {
    return `PalletInstance(${junction.palletinstance})`;
  } else if ('generalindex' in junction) {
    return `GeneralIndex(${junction.generalindex})`;
  } else if ('generalkey' in junction) {
    const junct = junction.generalkey as TJunctionGeneralKey['GeneralKey'];
    return `GeneralKey(${junct.length}, ${junct.data})`;
  } else if ('onlychild' in junction) {
    return `OnlyChild(${junction.onlychild})`;
  } else if ('plurality' in junction) {
    const junct = junction.plurality as TJunctionPlurality['Plurality'];
    return `Plurality(${junct.id}, ${junct.part})`;
  } else if ('globalconsensus' in junction) {
    return `GlobalConsensus(${formatNetwork(junction.globalconsensus)})`;
  }
  throw new Error('Unknown junction type');
};

export function findLocationInObject(obj: unknown): Location | null {
  function hasSpecificKeys(value: unknown): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      'parents' in value &&
      'interior' in value
    );
  }

  function searchObject(value: unknown): Location | null {
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
