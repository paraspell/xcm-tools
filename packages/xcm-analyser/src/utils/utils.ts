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

const formatJunctionValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return String(value);
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => formatJunctionValue(item)).join(', ')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 1) {
      const [variant, variantValue] = entries[0];
      if (
        variantValue === null ||
        typeof variantValue === 'string' ||
        typeof variantValue === 'number' ||
        typeof variantValue === 'boolean'
      ) {
        return `${variant}: ${formatJunctionValue(variantValue)}`;
      }

      return `${variant}(${formatJunctionValue(variantValue)})`;
    }

    return `{${entries
      .map(([key, item]) => `${key}: ${formatJunctionValue(item)}`)
      .join(', ')}}`;
  }

  return String(value);
};

export const convertJunctionToReadable = (junctionOriginal: Junction): string | never => {
  const junction = Object.fromEntries(
    Object.entries(junctionOriginal).map(([k, v]) => [k.toLowerCase(), v]),
  );

  if ('parachain' in junction) {
    return `Parachain(${junction.parachain})`;
  } else if ('accountid32' in junction) {
    const junct = junction.accountid32 as TJunctionAccountId32['AccountId32'];
    return `AccountId32(${formatJunctionValue(junct.network)}, ${junct.id})`;
  } else if ('accountindex64' in junction) {
    const junct = junction.accountindex64 as TJunctionAccountIndex64['AccountIndex64'];
    return `AccountIndex64(${formatJunctionValue(junct.network)}, ${junct.index})`;
  } else if ('accountkey20' in junction) {
    const junct = junction.accountkey20 as TJunctionAccountKey20['AccountKey20'];
    return `AccountKey20(${formatJunctionValue(junct.network)}, ${junct.key})`;
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
    return `Plurality(${formatJunctionValue(junct.id)}, ${formatJunctionValue(junct.part)})`;
  } else if ('globalconsensus' in junction) {
    return `GlobalConsensus(${formatJunctionValue(junction.globalconsensus)})`;
  }
  throw new Error('Unknown junction type');
};

export function findLocationInObject(obj: unknown): Location[] {
  function hasSpecificKeys(value: unknown): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      'parents' in value &&
      'interior' in value
    );
  }

  function searchObject(value: unknown): Location[] {
    if (hasSpecificKeys(value)) {
      return [LocationSchema.parse(value)];
    } else if (typeof value === 'object' && value !== null) {
      let found: Location[] = [];
      for (const key of Object.keys(value)) {
        found = found.concat(searchObject((value as Record<string, unknown>)[key]));
      }
      return found;
    }
    return [];
  }

  return searchObject(obj);
}
