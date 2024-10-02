export const replaceBigInt = (_key: string, value: unknown) =>
  typeof value === 'bigint' ? value.toString() : value;
