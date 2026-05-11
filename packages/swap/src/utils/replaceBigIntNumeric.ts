const SAFE_INT = BigInt(Number.MAX_SAFE_INTEGER);

// JSON.stringify replacer that converts bigint to number (or hex string if out
// of safe-integer range) so papi-decoded values stringify identically to the
// numeric form used in stored asset locations.
export const replaceBigIntNumeric = (_key: string, value: unknown) =>
  typeof value === 'bigint'
    ? value <= SAFE_INT
      ? Number(value)
      : `0x${value.toString(16)}`
    : value;
