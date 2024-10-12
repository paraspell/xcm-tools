import {
  MultiLocationSchema,
  type Junction,
  type JunctionType,
  type MultiLocation,
} from '../types';
import { convertJunctionToReadable, findMultiLocationInObject } from '../utils/utils';

/**
 * Converts a multi-location JSON string into its URL representation.
 *
 * @param multiLocationJson - The multi-location as a JSON string.
 * @returns The URL representation of the multi-location.
 */
export const convertMultilocationToUrlJson = (multiLocationJson: string): string => {
  const multiLocation = JSON.parse(multiLocationJson) as MultiLocation;
  return convertMultilocationToUrl(multiLocation);
};

/**
 * Converts a multi-location object into its URL representation.
 *
 * @param args - The multi-location object.
 * @returns The URL representation of the multi-location.
 * @throws Will throw an error if the interior or junction array is empty.
 */
export const convertMultilocationToUrl = (args: unknown): string => {
  const { parents, interior } = MultiLocationSchema.parse(args);
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

/**
 * Converts an array of XCM multi-location arguments into an array of URL representations.
 *
 * @param args - An array of arguments that may contain multi-location objects.
 * @returns An array of URL representations for each found multi-location.
 */
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
