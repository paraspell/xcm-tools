export const lowercaseFirstLetter = (value: string) =>
  value.charAt(0).toLowerCase() + value.slice(1);

export const snakeToCamel = (str: string) =>
  str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", ""),
  );
