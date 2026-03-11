import type { TRelaychain, TSubstrateChain } from '@paraspell/sdk';
import { RELAYCHAINS } from '@paraspell/sdk';

export const encodeDate = (d: Date | null | undefined) => {
  return d ? d.toISOString() : undefined;
};

export const decodeDate = (s: string | null): Date | null => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

export const encodeList = (list: string[]) => {
  return list.length ? list.join(',') : undefined;
};

export const decodeList = (s: string | null): TSubstrateChain[] => {
  return s ? (s.split(',').filter(Boolean) as TSubstrateChain[]) : [];
};

export const encodeEcosystem = (e: TRelaychain): string => {
  return e.toString();
};

export const decodeEcosystem = (s: string | null, fallback: TRelaychain): TRelaychain => {
  if (!s) return fallback;
  const norm = s.trim().toLowerCase();
  const match = RELAYCHAINS.find(v => v.toLowerCase() === norm);
  return match ?? fallback;
};

export const setOrDelete = (params: URLSearchParams, key: string, value?: string) => {
  if (value && value.length) params.set(key, value);
  else params.delete(key);
};
