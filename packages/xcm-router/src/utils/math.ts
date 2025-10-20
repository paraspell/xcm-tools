export const pow10n = (d: number | bigint): bigint => {
  let result = 1n;
  const exp = BigInt(d);
  for (let i = 0n; i < exp; i++) result *= 10n;
  return result;
};
