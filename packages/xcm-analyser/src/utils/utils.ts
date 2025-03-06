import type {
  Junction,
  MultiLocation,
  TJunctionAccountId32,
  TJunctionAccountIndex64,
  TJunctionAccountKey20,
  TJunctionGeneralKey,
  TJunctionPlurality,
} from '../types';
import { MultiLocationSchema } from '../types';

export const convertJunctionToReadable = (junctionOriginal: Junction): string | never => {
  const junction = Object.fromEntries(
    Object.entries(junctionOriginal).map(([k, v]) => [k.toLowerCase(), v]),
  );

  if ('parachain' in junction) {
    return `Parachain(${junction.parachain})`;
  } else if ('accountid32' in junction) {
    const junct = junction.accountid32 as TJunctionAccountId32['AccountId32'];
    return `AccountId32(${junct.network}, ${junct.id})`;
  } else if ('accountindex64' in junction) {
    const junct = junction.accountindex64 as TJunctionAccountIndex64['AccountIndex64'];
    return `AccountIndex64(${junct.network}, ${junct.index})`;
  } else if ('accountkey20' in junction) {
    const junct = junction.accountkey20 as TJunctionAccountKey20['AccountKey20'];
    return `AccountKey20(${junct.network}, ${junct.key})`;
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
    return `GlobalConsensus(${junction.globalconsensus})`;
  }
  throw new Error('Unknown junction type');
};

export function findMultiLocationInObject(obj: unknown): MultiLocation | null {
  function hasSpecificKeys(value: unknown): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      'parents' in value &&
      'interior' in value
    );
  }

  function searchObject(value: unknown): MultiLocation | null {
    if (hasSpecificKeys(value)) {
      const parsedValue = MultiLocationSchema.parse(value);
      return parsedValue;
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
