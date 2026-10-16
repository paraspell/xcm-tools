import type { CSSVariablesResolver, MantineTheme } from '@mantine/core';
import { alpha, v8CssVariablesResolver } from '@mantine/core';

const light = (theme: MantineTheme) => ({
  '--mantine-color-dimmed': '#5c636e',
  '--mantine-color-default-border': 'var(--mantine-color-gray-3)',
  '--mantine-color-mainColor-light': 'var(--mantine-color-mainColor-0)',

  '--ps-script': 'var(--mantine-color-mainColor-7)',
  '--ps-surface': 'var(--mantine-color-white)',
  '--ps-sunk': 'var(--mantine-color-gray-0)',
  '--ps-line': 'var(--mantine-color-gray-1)',
  '--ps-line-2': 'var(--mantine-color-gray-2)',
  '--ps-ink-2': '#25262b',
  '--ps-ink-3': 'var(--mantine-color-gray-7)',
  '--ps-muted-2': '#6b6f78',
  '--ps-pink-line': 'var(--mantine-color-mainColor-1)',

  '--ps-api-bg': 'var(--mantine-color-api-1)',
  '--ps-api-line': 'var(--mantine-color-api-4)',
  '--ps-api-tile': 'var(--mantine-color-api-0)',
  '--ps-api-label': 'var(--mantine-color-api-8)',

  '--ps-ok-bg': '#e6f6ec',
  '--ps-ok-ink': '#1d7a45',
  '--ps-get-bg': '#e8f3ff',
  '--ps-get-ink': '#1c63c0',

  '--ps-glow-1': alpha(theme.colors.mainColor[1], 0.55),
  '--ps-glow-2': 'rgba(230, 218, 255, 0.6)',
});

const dark = (theme: MantineTheme) => ({
  '--ps-script': '#ff7ab6',
  '--ps-surface': 'var(--mantine-color-dark-6)',
  '--ps-sunk': 'var(--mantine-color-dark-8)',
  '--ps-line': '#2a2731',
  '--ps-line-2': 'var(--mantine-color-dark-5)',
  '--ps-ink-2': 'var(--mantine-color-dark-1)',
  '--ps-ink-3': '#bdb8c8',
  '--ps-muted-2': 'var(--mantine-color-dark-3)',
  '--ps-pink-line': alpha(theme.other.darkAccent, 0.5),

  '--ps-api-bg': 'var(--mantine-color-api-11)',
  '--ps-api-line': 'var(--mantine-color-api-9)',
  '--ps-api-tile': 'var(--mantine-color-api-12)',
  '--ps-api-label': 'var(--mantine-color-api-6)',

  '--ps-ok-bg': 'rgba(60, 200, 120, 0.16)',
  '--ps-ok-ink': '#7ee0a1',
  '--ps-get-bg': 'rgba(80, 150, 255, 0.16)',
  '--ps-get-ink': '#8cc0ff',

  '--ps-glow-1': alpha(theme.colors.mainColor[6], 0.2),
  '--ps-glow-2': 'rgba(124, 77, 255, 0.18)',

  '--mantine-color-anchor': theme.other.darkAccent,
  '--mantine-color-mainColor-text': theme.other.darkAccent,
  '--mantine-color-mainColor-light': alpha(theme.colors.mainColor[6], 0.2),
  '--mantine-color-mainColor-light-color': theme.other.darkAccent,
});

export const cssVariablesResolver: CSSVariablesResolver = (theme) => {
  const base = v8CssVariablesResolver(theme);
  return {
    variables: {
      ...base.variables,
      '--ps-font-script': "'Dancing Script', cursive",
      '--ps-focus-ring': alpha(theme.colors.mainColor[6], 0.15),
    },
    light: { ...base.light, ...light(theme) },
    dark: { ...base.dark, ...dark(theme) },
  };
};
