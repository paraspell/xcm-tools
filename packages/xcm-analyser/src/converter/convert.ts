import { LocationSchema } from '../schema';
import type { Junction, ParsedLocation } from '../types';
import { convertJunctionToReadable, findLocationsInObject } from '../utils/utils';

const normalizeInterior = (interior: ParsedLocation['interior']): Junction[] => {
  if (interior === 'Here' || 'Here' in interior) return [];

  const [junctions] = Object.values<Junction | Junction[]>(interior);

  return Array.isArray(junctions) ? junctions : [junctions];
};

/**
 * Converts a XCM location JSON string into its URL representation.
 *
 * @param locationJson - The location as a JSON string.
 * @returns The URL representation of the location.
 */
export const convertLocationToUrlJson = (locationJson: string): string => {
  const location: unknown = JSON.parse(locationJson);
  return convertLocationToUrl(location);
};

/**
 * Converts a location object into its URL representation.
 *
 * @param args - The location object.
 * @returns The URL representation of the location.
 */
export const convertLocationToUrl = (args: unknown): string => {
  const { parents, interior } = LocationSchema.parse(args);
  const pathStart = parents > 0 ? '../'.repeat(parents) : './';

  const path = normalizeInterior(interior)
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
  return args.flatMap((arg) =>
    findLocationsInObject(arg).map((location) => convertLocationToUrl(location)),
  );
};
