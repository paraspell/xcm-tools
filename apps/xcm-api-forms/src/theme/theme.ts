import type { MantineColorsTuple } from '@mantine/core';
import {
  ActionIcon,
  alpha,
  Anchor,
  Badge,
  Button,
  createTheme,
  Input,
  InputWrapper,
  Paper,
  rem,
  Text,
  Title,
} from '@mantine/core';

import classes from './components.module.css';

declare module '@mantine/core' {
  export interface MantineThemeOther {
    darkAccent: string;
  }
}

const themePalette: MantineColorsTuple = [
  '#ffe9f6',
  '#ffd1e6',
  '#faa1c9',
  '#f66eab',
  '#f24391',
  '#f02881',
  '#f01879',
  '#d60867',
  '#c0005c',
  '#a9004f',
];

const darkPalette: MantineColorsTuple = [
  '#f3f1f7',
  '#dcd9e3',
  '#a9a4b5',
  '#9893a5',
  '#3c3745',
  '#322e3a',
  '#1b1920',
  '#121116',
  '#0d0c10',
  '#08070a',
];

const apiPalette: MantineColorsTuple = [
  '#fffaf0',
  '#fff8ea',
  '#fff6e4',
  '#fae8c4',
  '#f6e8cb',
  '#ffd696',
  '#dcb874',
  '#aa6e14',
  '#8a6a2c',
  '#3a3020',
  '#342916',
  '#201b12',
  '#1a1711',
];

const black = '#141317';

const fontFamily =
  "Figtree, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const theme = createTheme({
  primaryColor: 'mainColor',
  primaryShade: 6,
  colors: {
    mainColor: themePalette,
    dark: darkPalette,
    api: apiPalette,
  },
  black,
  radius: { 'md-lg': rem(12), 'lg-xl': rem(24) },
  shadows: {
    card: `0 ${rem(1)} ${rem(3)} ${alpha(black, 0.05)}, 0 ${rem(36)} ${rem(60)} ${rem(-30)} ${alpha(black, 0.25)}`,
  },
  fontFamily,
  fontFamilyMonospace:
    "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  headings: {
    fontFamily,
    fontWeight: '900',
    sizes: {
      h1: { fontSize: rem(38), lineHeight: '1.08' },
    },
  },
  defaultRadius: 'md-lg',
  other: { darkAccent: '#ff5fa6' },
  components: {
    ActionIcon: ActionIcon.extend({
      defaultProps: { variant: 'default' },
      classNames: { root: classes.control },
    }),
    Anchor: Anchor.extend({ defaultProps: { underline: 'never' } }),
    Badge: Badge.extend({ classNames: { root: classes.badge } }),
    Button: Button.extend({ classNames: { root: classes.control } }),
    Input: Input.extend({
      vars: () => ({ wrapper: { '--input-height': rem(46) } }),
      classNames: { wrapper: classes.inputWrapper, input: classes.input },
    }),
    InputWrapper: InputWrapper.extend({
      defaultProps: { withAsterisk: false },
      classNames: { label: classes.label },
    }),
    Paper: Paper.extend({
      defaultProps: { radius: 'lg-xl', shadow: 'card' },
      classNames: { root: classes.paper },
    }),
    Text: Text.extend({ classNames: { root: classes.text } }),
    Title: Title.extend({ classNames: { root: classes.title } }),
  },
});
