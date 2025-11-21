export const createName = (name: string) => {
  return new RegExp(`^${name}(\\s+${name})?$`);
}