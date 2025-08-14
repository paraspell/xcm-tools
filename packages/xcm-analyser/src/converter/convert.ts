import { LocationSchema } from '../schema';
import type { Junction, JunctionType, Location } from '../types';
import { convertJunctionToReadable, findLocationInObject } from '../utils/utils';

/**
 * Converts a XCM location JSON string into its URL representation.
 *
 * @param locationJson - The location as a JSON string.
 * @returns The URL representation of the location.
 */
export const convertLocationToUrlJson = (locationJson: string): string => {
  const location = JSON.parse(locationJson) as Location;
  return convertLocationToUrl(location);
};

/**
 * Converts a location object into its URL representation.
 *
 * @param args - The location object.
 * @returns The URL representation of the location.
 * @throws Will throw an error if the interior or junction array is empty.
 */
export const convertLocationToUrl = (args: unknown): string => {
  const { parents, interior } = LocationSchema.parse(args);
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
 * Converts an array of XCM location arguments into an array of URL representations.
 *
 * @param args - An array of arguments that may contain location objects.
 * @returns An array of URL representations for each found location.
 */
export const convertXCMToUrls = (args: unknown[]): string[] => {
  return args.flatMap((arg) => {
    const location = findLocationInObject(arg);
    if (location !== null && location !== undefined) {
      return [convertLocationToUrl(location)];
    } else {
      return [];
    }
  });
};
