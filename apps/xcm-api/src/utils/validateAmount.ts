const DECIMAL_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

export const validateAmount = (val: string) => {
  const normalized = val.trim();

  if (!DECIMAL_PATTERN.test(normalized)) return false;

  const num = Number(normalized);
  return Number.isFinite(num) && num > 0;
};
