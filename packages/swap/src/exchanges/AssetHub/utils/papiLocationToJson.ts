// NetworkId enum variants that polkadot.js `.toJSON()` lowercases when the
// variant carries no data (e.g. `Kusama` -> `kusama`). Struct/tuple variants
// like `Ethereum { chain_id }` keep their PascalCase.
const LOWERCASED_PLAIN_VARIANTS = new Set([
  'Polkadot',
  'Kusama',
  'Westend',
  'Rococo',
  'Wococo',
  'BitcoinCore',
  'BitcoinCash',
  'PolkadotBulletin',
]);

const snakeToCamel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

const isBinary = (v: unknown): v is { asHex: () => string } =>
  typeof v === 'object' && v !== null && 'asHex' in v && typeof v.asHex === 'function';

const JUNCTIONS_VARIANT = /^X[1-8]$/;

// Recursively convert polkadot-api's `{ type, value }` enum encoding into the
// flat `{ VariantName: value }` shape used by stored asset locations (which
// originate from polkadot.js's `.toJSON()`).
//
// Reproduces three pjs `.toJSON()` quirks so output is byte-identical:
//   - plain NetworkId variants lowercased (`Kusama` -> `kusama`)
//   - struct field names snake_case -> camelCase (`chain_id` -> `chainId`)
//   - `Binary` byte values rendered as `0x...` hex strings
export const papiLocationToJson = (value: unknown): unknown => {
  if (value === undefined) return null;
  if (isBinary(value)) return value.asHex();
  if (typeof value !== 'object' || value === null) return value;
  if (Array.isArray(value)) return value.map(papiLocationToJson);

  const obj = value as Record<string, unknown>;
  if (
    Object.keys(obj).length === 2 &&
    typeof obj.type === 'string' &&
    Object.prototype.hasOwnProperty.call(obj, 'value')
  ) {
    // v3 Junctions encode X1 as a single Junction (not an array). pjs
    // normalizes X1..X8 to array form, so we do the same.
    if (JUNCTIONS_VARIANT.test(obj.type) && !Array.isArray(obj.value)) {
      return { [obj.type]: [papiLocationToJson(obj.value)] };
    }
    const variant =
      obj.value === undefined && LOWERCASED_PLAIN_VARIANTS.has(obj.type)
        ? obj.type[0].toLowerCase() + obj.type.slice(1)
        : obj.type;
    return { [variant]: papiLocationToJson(obj.value) };
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[snakeToCamel(k)] = papiLocationToJson(v);
  }
  return out;
};
