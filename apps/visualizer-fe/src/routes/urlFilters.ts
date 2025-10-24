import type { TRelaychain, TSubstrateChain } from '@paraspell/sdk';
import { RELAYCHAINS } from '@paraspell/sdk';

export function encodeDate(d: Date | null | undefined) {
  return d ? d.toISOString() : undefined;
}

export function decodeDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function encodeList(list: string[]) {
  return list.length ? list.join(',') : undefined;
}

export function decodeList(s: string | null): TSubstrateChain[] {
  return s ? (s.split(',').filter(Boolean) as TSubstrateChain[]) : [];
}

export function encodeEcosystem(e: TRelaychain): string {
  return e.toString();
}

export function decodeEcosystem(s: string | null, fallback: TRelaychain): TRelaychain {
  if (!s) return fallback;
  const norm = s.trim().toLowerCase();
  const match = RELAYCHAINS.find(v => v.toLowerCase() === norm);
  return match ?? fallback;
}

export function setOrDelete(params: URLSearchParams, key: string, value?: string) {
  if (value && value.length) params.set(key, value);
  else params.delete(key);
}
