export const validateAmount = (val: string) => {
  const num = Number(val);
  return Number.isFinite(num) && num > 0;
};
