export const formatNumber = (v: number | string): string => {
  if (v === null || v === undefined || v === '') return '';

  const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 20 });
  const str = v.toString().replace(/[^0-9]/g, '');
  if (!str) return String(v);

  if (str.length <= 10) {
    const num = Number(v);
    return isNaN(num) ? String(v) : nf.format(num);
  }

  const num = BigInt(str);
  if (num === 0n) return '0';

  const exponent = str.length - 1;
  const firstDigits = str.slice(0, 3);
  const mantissa = Number(`${firstDigits[0]}.${firstDigits.slice(1)}`);

  const superscript = exponent
    .toString()
    .replace(/0/g, '⁰')
    .replace(/1/g, '¹')
    .replace(/2/g, '²')
    .replace(/3/g, '³')
    .replace(/4/g, '⁴')
    .replace(/5/g, '⁵')
    .replace(/6/g, '⁶')
    .replace(/7/g, '⁷')
    .replace(/8/g, '⁸')
    .replace(/9/g, '⁹');

  return `${mantissa} × 10${superscript}`;
};
