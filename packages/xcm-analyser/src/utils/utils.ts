/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { type MultiLocation, type Junction, MultiLocationSchema } from '../types';

export const convertJunctionToReadable = (junctionOriginal: Junction): string | never => {
  const junction = Object.fromEntries(
    Object.entries(junctionOriginal).map(([k, v]) => [k.toLowerCase(), v]),
  );

  if ('parachain' in junction) {
    return `Parachain(${junction.parachain})`;
  } else if ('accountid32' in junction) {
    return `AccountId32(${junction.accountid32.network}, ${junction.accountid32.id})`;
  } else if ('accountindex64' in junction) {
    return `AccountIndex64(${junction.accountindex64.network}, ${junction.accountindex64.index})`;
  } else if ('accountkey20' in junction) {
    return `AccountKey20(${junction.accountkey20.network}, ${junction.accountkey20.key})`;
  } else if ('palletinstance' in junction) {
    return `PalletInstance(${junction.palletinstance})`;
  } else if ('generalindex' in junction) {
    return `GeneralIndex(${junction.generalindex})`;
  } else if ('generalkey' in junction) {
    return `GeneralKey(${junction.generalkey.length}, ${junction.generalkey.data})`;
  } else if ('onlychild' in junction) {
    return `OnlyChild(${junction.onlychild})`;
  } else if ('plurality' in junction) {
    return `Plurality(${junction.plurality.id}, ${junction.plurality.part})`;
  } else if ('globalconsensus' in junction) {
    return `GlobalConsensus(${junction.globalconsensus})`;
  }
  console.log('junction', junction);
  throw new Error('Unknown junction type');
};

export function findMultiLocationInObject(obj: any): MultiLocation {
  function hasSpecificKeys(value: any): boolean {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      'parents' in value &&
      'interior' in value
    );
  }

  function searchObject(value: any): any {
    if (hasSpecificKeys(value)) {
      const parsedValue = MultiLocationSchema.parse(value);
      return parsedValue;
    } else if (typeof value === 'object' && value !== null) {
      for (const key of Object.keys(value)) {
        const result = searchObject(value[key]);

        if (result) return result;
      }
    }
    return null;
  }

  return searchObject(obj);
}
