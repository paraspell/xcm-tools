/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { describe, expect, it } from 'vitest';

import { capitalizeKeys, capitalizeLocation } from './capitalizeLocation';

describe('capitalizeKeys', () => {
  it('should return primitive values as is', () => {
    expect(capitalizeKeys('hello')).toBe('hello');
    expect(capitalizeKeys(123)).toBe(123);
    expect(capitalizeKeys(null)).toBeNull();
    expect(capitalizeKeys(undefined)).toBeUndefined();
    expect(capitalizeKeys(true)).toBe(true);
  });

  it('should capitalize keys of a simple object', () => {
    const obj = { name: 'john', age: 30 };
    const expected = { Name: 'john', Age: 30 };
    expect(capitalizeKeys(obj)).toEqual(expected);
  });

  it('should handle empty objects', () => {
    expect(capitalizeKeys({})).toEqual({});
  });

  it('should recursively capitalize keys in nested objects up to depth 2 for leaf nodes', () => {
    const obj = {
      user: {
        firstName: 'john',
        lastName: 'doe',
        address: { street: 'main st', city: 'anytown', deep: { deeperStill: 'value' } },
      },
      id: 1,
    };
    const expected = {
      User: {
        FirstName: 'john',
        LastName: 'doe',
        Address: { street: 'main st', city: 'anytown', Deep: { deeperStill: 'value' } },
      },
      Id: 1,
    };
    expect(capitalizeKeys(obj)).toEqual(expected);
  });

  it('should not capitalize leaf node keys beyond depth 2', () => {
    const obj = {
      level1: {
        level2: {
          level3Leaf: 'value1',
          level3Obj: { leaf4: 'value2' },
        },
      },
    };
    const expected = {
      Level1: {
        Level2: {
          level3Leaf: 'value1',
          Level3Obj: { leaf4: 'value2' },
        },
      },
    };
    expect(capitalizeKeys(obj)).toEqual(expected);
  });

  it('should process arrays of primitives', () => {
    const arr = [1, 'test', null];
    expect(capitalizeKeys(arr)).toEqual([1, 'test', null]);
  });

  it('should process arrays of objects, capitalizing their keys', () => {
    const arr = [{ itemOne: 1 }, { itemTwo: 'two' }];
    const expected = [{ ItemOne: 1 }, { ItemTwo: 'two' }];
    expect(capitalizeKeys(arr)).toEqual(expected);
  });

  it('should handle the "generalKey" transformation for strings', () => {
    const obj = { generalKey: '0x123456' };
    const expected = {
      GeneralKey: {
        Length: 3,
        Data: '0x1234560000000000000000000000000000000000000000000000000000000000',
      },
    };
    expect(capitalizeKeys(obj)).toEqual(expected);
  });

  it('should handle "generalKey" without "0x" prefix', () => {
    const obj = { generalKey: 'abcd' };
    const expected = {
      GeneralKey: {
        Length: 2,
        Data: '0xabcd000000000000000000000000000000000000000000000000000000000000',
      },
    };
    expect(capitalizeKeys(obj)).toEqual(expected);
  });

  it('should handle "generalKey" with an empty string', () => {
    const obj = { generalKey: '' };
    const expected = {
      GeneralKey: {
        Length: 0,
        Data: '0x0000000000000000000000000000000000000000000000000000000000000000',
      },
    };
    expect(capitalizeKeys(obj)).toEqual(expected);
  });

  it('should not transform "generalKey" if its value is not a string', () => {
    const obj = { generalKey: 123 };
    const expected = { GeneralKey: 123 };
    expect(capitalizeKeys(obj)).toEqual(expected);
  });

  it('should handle objects with no own properties', () => {
    const obj = Object.create({ inheritedKey: 'value' });
    expect(capitalizeKeys(obj)).toEqual({});
  });

  it('should handle complex nested structure with arrays and special keys', () => {
    const obj = {
      firstLevel: {
        secondLevel: [
          { itemA: 'a', generalKey: '0xff' },
          { itemB: 'b', subItem: { deepLeaf: 'value' } },
        ],
        anotherKey: 'simple',
      },
    };
    const expectedPaddedDataForFF = 'ff'.padEnd(64, '0');
    const expected = {
      FirstLevel: {
        SecondLevel: [
          {
            itemA: 'a',
            generalKey: {
              length: 1,
              data: '0x' + expectedPaddedDataForFF,
            },
          },
          {
            itemB: 'b',
            SubItem: {
              deepLeaf: 'value',
            },
          },
        ],
        AnotherKey: 'simple',
      },
    };
    expect(capitalizeKeys(obj)).toEqual(expected);
  });
});

describe('capitalizeLocation', () => {
  it('should capitalize keys of the "interior" object property', () => {
    const obj = {
      exterior: 'value',
      interior: { locationName: 'home', coordinates: { lat: 10, lon: 20 } },
    };
    const expected = {
      exterior: 'value',
      interior: { LocationName: 'home', Coordinates: { Lat: 10, Lon: 20 } },
    };
    expect(capitalizeLocation(obj)).toEqual(expected);
  });

  it('should handle "interior" being null or not an object', () => {
    const obj1 = { interior: null };
    const expected1 = { interior: null };
    expect(capitalizeLocation(obj1)).toEqual(expected1);

    const obj2 = { interior: 'notAnObject' };
    const expected2 = { interior: 'notAnObject' };
    expect(capitalizeLocation(obj2)).toEqual(expected2);
  });

  it('should handle "interior" being an empty object', () => {
    const obj = { interior: {} };
    const expected = { interior: {} };
    expect(capitalizeLocation(obj)).toEqual(expected);
  });

  it('should correctly apply depth rules for "interior" object via capitalizeKeys', () => {
    const obj = {
      interior: {
        level1: {
          level2: {
            level3Leaf: 'value1',
            level3Obj: { leaf4: 'value2' },
          },
        },
      },
    };
    const expected = {
      interior: {
        Level1: {
          Level2: {
            level3Leaf: 'value1',
            Level3Obj: { leaf4: 'value2' },
          },
        },
      },
    };
    expect(capitalizeLocation(obj)).toEqual(expected);
  });
  it('should handle "generalKey" transformation within "interior"', () => {
    const obj = {
      interior: { myKey: 'value', generalKey: '0xabce' },
    };
    const expectedPaddedData = 'abce'.padEnd(64, '0');
    const expected = {
      interior: {
        MyKey: 'value',
        GeneralKey: {
          Length: 2,
          Data: '0x' + expectedPaddedData,
        },
      },
    };
    expect(capitalizeLocation(obj)).toEqual(expected);
  });

  it('should return the original object instance, modified', () => {
    const obj = { interior: { testKey: 'testValue' } } as any;
    const result = capitalizeLocation(obj);
    expect(result).toBe(obj);
    expect(obj.interior.TestKey).toBe('testValue');
  });
});
