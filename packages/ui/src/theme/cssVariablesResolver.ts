import type { CSSVariablesResolver, MantineTheme } from '@mantine/core';
import { alpha, v8CssVariablesResolver } from '@mantine/core';

const lightNeutral = {
  '--mantine-color-dimmed': '#5c636e',
  '--mantine-color-default-border': 'var(--mantine-color-gray-3)',
};

const lightTokens = (theme: MantineTheme) => ({
  '--ps-accent-2': 'var(--mantine-color-mainColor-7)',
  '--ps-ink-2': '#25262b',
  '--ps-ink-3': 'var(--mantine-color-gray-7)',
  '--ps-muted-2': '#6b6f78',
  '--ps-surface': 'var(--mantine-color-white)',
  '--ps-sunk': 'var(--mantine-color-gray-0)',
  '--ps-line': 'var(--mantine-color-gray-1)',
  '--ps-line-2': 'var(--mantine-color-gray-2)',
  '--ps-pink-line': 'var(--mantine-color-mainColor-1)',

  '--ps-api-bg': 'var(--mantine-color-api-1)',
  '--ps-api-line': 'var(--mantine-color-api-4)',
  '--ps-api-tile': 'var(--mantine-color-api-0)',
  '--ps-api-label': 'var(--mantine-color-api-8)',

  '--ps-get-bg': '#e8f3ff',
  '--ps-get-ink': '#1c63c0',
  '--ps-ok-bg': '#e6f6ec',
  '--ps-ok-ink': '#1d7a45',

  '--ps-glow-1': alpha(theme.colors.mainColor[1], 0.55),
  '--ps-glow-2': 'rgba(230, 218, 255, 0.6)',

  '--ps-code-text': '#383a42',
  '--ps-code-comment': '#a0a1a7',
  '--ps-code-keyword': '#a626a4',
  '--ps-code-tag': '#e45649',
  '--ps-code-literal': '#0184bb',
  '--ps-code-string': '#50a14f',
  '--ps-code-number': '#986801',
  '--ps-code-title': '#4078f2',
  '--ps-code-class': '#c18401',
});

const darkTokens = (theme: MantineTheme): ReturnType<typeof lightTokens> => ({
  '--ps-accent-2': '#ff7ab6',
  '--ps-ink-2': 'var(--mantine-color-dark-1)',
  '--ps-ink-3': '#bdb8c8',
  '--ps-muted-2': 'var(--mantine-color-dark-3)',
  '--ps-surface': 'var(--mantine-color-dark-6)',
  '--ps-sunk': 'var(--mantine-color-dark-8)',
  '--ps-line': '#2a2731',
  '--ps-line-2': 'var(--mantine-color-dark-5)',
  '--ps-pink-line': alpha(theme.other.darkAccent, 0.5),

  '--ps-api-bg': 'var(--mantine-color-api-11)',
  '--ps-api-line': 'var(--mantine-color-api-9)',
  '--ps-api-tile': 'var(--mantine-color-api-12)',
  '--ps-api-label': 'var(--mantine-color-api-6)',

  '--ps-get-bg': 'rgba(80, 150, 255, 0.16)',
  '--ps-get-ink': '#8cc0ff',
  '--ps-ok-bg': 'rgba(60, 200, 120, 0.16)',
  '--ps-ok-ink': '#7ee0a1',

  '--ps-glow-1': alpha(theme.colors.mainColor[6], 0.2),
  '--ps-glow-2': 'rgba(124, 77, 255, 0.18)',

  '--ps-code-text': '#abb2bf',
  '--ps-code-comment': '#7f848e',
  '--ps-code-keyword': '#c678dd',
  '--ps-code-tag': '#e06c75',
  '--ps-code-literal': '#56b6c2',
  '--ps-code-string': '#98c379',
  '--ps-code-number': '#d19a66',
  '--ps-code-title': '#61afef',
  '--ps-code-class': '#e5c07b',
});

const darkPrimary = (theme: MantineTheme) => ({
  '--mantine-color-anchor': theme.other.darkAccent,
  '--mantine-color-mainColor-text': theme.other.darkAccent,
  '--mantine-color-mainColor-light-color': theme.other.darkAccent,
});

export const baseCssVariablesResolver: CSSVariablesResolver = (theme) => {
  const base = v8CssVariablesResolver(theme);
  return {
    variables: {
      ...base.variables,
      '--ps-font-script': "'Dancing Script', cursive",
      '--ps-focus-ring': alpha(theme.colors.mainColor[6], 0.15),
    },
    light: { ...base.light, ...lightNeutral, ...lightTokens(theme) },
    dark: { ...base.dark, ...darkTokens(theme), ...darkPrimary(theme) },
  };
};
