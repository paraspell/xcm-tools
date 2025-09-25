import { Ecosystem } from '../types/types';

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

export function decodeList(s: string | null): string[] {
  return s ? s.split(',').filter(Boolean) : [];
}

export function encodeEcosystem(e: Ecosystem): string {
  return String(e);
}

export function decodeEcosystem(s: string | null, fallback: Ecosystem): Ecosystem {
  if (!s) return fallback;
  const norm = s.trim().toLowerCase();
  const match = (Object.values(Ecosystem) as string[]).find(v => v.toLowerCase() === norm);
  return (match as Ecosystem) ?? fallback;
}

export function setOrDelete(params: URLSearchParams, key: string, value?: string) {
  if (value && value.length) params.set(key, value);
  else params.delete(key);
}
