export const validateAmount = (val: string) => {
  const num = parseFloat(val);
  return !isNaN(num) && num > 0;
};
