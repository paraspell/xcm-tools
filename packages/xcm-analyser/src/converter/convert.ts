import { MultiLocationSchema, type Junction, type JunctionType, type MultiLocation } from '../types';
import { convertJunctionToReadable, findMultiLocationInObject } from '../utils/utils';

export const convertMultilocationToUrlJson = (multiLocationJson: string): string => {
  const multiLocation: MultiLocation = JSON.parse(multiLocationJson);
  return convertMultilocationToUrl(multiLocation);
};

export const convertMultilocationToUrl = (args: unknown): string => {
  const { parents, interior } = MultiLocationSchema.parse(args)
  const parentsNum = Number(parents);

  const entries = Object.entries(interior);
  if (entries.length === 0) throw new Error('Interior is empty');

  const [, junctions] = entries[0] as [JunctionType, Junction | Junction[]];

  const isX1 = !Array.isArray(junctions);

  if (!isX1 && junctions.length === 0) throw new Error('Junction array is empty');

  const pathStart = parentsNum > 0 ? '../'.repeat(parentsNum) : './';
  const path = (isX1 ? [junctions] : junctions)
    .map((junction) => convertJunctionToReadable(junction))
    .join('/');

  return `${pathStart}${path}`;
};

export const convertXCMToUrls = (args: unknown[]): string[] => {
  return args.flatMap((arg) => {
    const multiLocation = findMultiLocationInObject(arg);
    if (multiLocation !== null && multiLocation !== undefined) {
      return [convertMultilocationToUrl(multiLocation)];
    } else {
      return [];
    }
  });
};
