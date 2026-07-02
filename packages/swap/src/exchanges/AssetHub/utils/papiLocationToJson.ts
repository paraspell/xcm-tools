import type { TLocation } from '@paraspell/sdk-common';
import { lowercaseFirstLetter, snakeToCamel } from '@paraspell/sdk-common';
import { toHex } from 'polkadot-api/utils';

const isBinary = (v: unknown): v is { asHex: () => string } =>
  typeof v === 'object' && v !== null && 'asHex' in v && typeof v.asHex === 'function';

const JUNCTIONS_VARIANT = /^X[1-8]$/;

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

const toJson = (value: unknown, depth: number): unknown => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'bigint')
    return value <= MAX_SAFE ? Number(value) : '0x' + value.toString(16).padStart(32, '0');
  if (isBinary(value)) return value.asHex();
  if (value instanceof Uint8Array) return toHex(value);
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => toJson(v, depth));

  const obj = value as Record<string, unknown>;
  if (
    Object.keys(obj).length === 2 &&
    typeof obj.type === 'string' &&
    Object.prototype.hasOwnProperty.call(obj, 'value')
  ) {
    if (/^V\d+$/.test(obj.type)) return toJson(obj.value, depth);
    const inner = toJson(obj.value, depth + 1);
    if (obj.type === 'GeneralKey' && typeof inner === 'string') {
      return {
        GeneralKey: { length: (inner.length - 2) / 2, data: '0x' + inner.slice(2).padEnd(64, '0') },
      };
    }
    if (JUNCTIONS_VARIANT.test(obj.type)) {
      return { [obj.type]: Array.isArray(obj.value) ? inner : [inner] };
    }
    const isObjectPayload = obj.value !== null && typeof obj.value === 'object';
    const key = depth <= 2 || isObjectPayload ? obj.type : lowercaseFirstLetter(obj.type);
    return { [key]: inner };
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[snakeToCamel(k)] = toJson(v, depth + 1);
  }
  return out;
};

export const papiLocationToJson = (loc: unknown): TLocation | undefined =>
  loc === null || loc === undefined ? undefined : (toJson(loc, 0) as TLocation);
