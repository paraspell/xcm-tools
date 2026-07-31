export const validateAmount = (val: string) => {
  if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(val)) {
    return false;
  }

  const num = Number(val);
  return Number.isFinite(num) && num > 0;
};
