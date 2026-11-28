import type { CSSVariablesResolver } from '@mantine/core';
import { alpha } from '@mantine/core';
import { baseCssVariablesResolver } from '@paraspell/ui';

export const cssVariablesResolver: CSSVariablesResolver = (theme) => {
  const base = baseCssVariablesResolver(theme);
  return {
    variables: base.variables,
    light: {
      ...base.light,
      '--mantine-color-mainColor-light': 'var(--mantine-color-mainColor-0)',
    },
    dark: {
      ...base.dark,
      '--mantine-color-mainColor-light': alpha(theme.colors.mainColor[6], 0.2),
    },
  };
};
