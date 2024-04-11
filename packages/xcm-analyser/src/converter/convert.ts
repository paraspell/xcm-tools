import { type Junction, type JunctionType, type MultiLocation } from '../types';
import { convertJunctionToReadable, findMultiLocationInObject } from '../utils/utils';

export const convertMultilocationToUrlJson = (multiLocationJson: string): string => {
  const multiLocation: MultiLocation = JSON.parse(multiLocationJson);
  return convertMultilocationToUrl(multiLocation);
};

export const convertMultilocationToUrl = ({ parents, interior }: MultiLocation): string => {
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

export const convertXCMToUrls = (txArguments: any): string[] => {
  return txArguments.flatMap((arg: any) => {
    const multiLocation = findMultiLocationInObject(arg);
    if (multiLocation !== null && multiLocation !== undefined) {
      return [convertMultilocationToUrl(multiLocation)];
    } else {
      return [];
    }
  });
};
