import {
  ActionIcon,
  Badge,
  Button,
  createTheme,
  mergeThemeOverrides,
  rem,
  Text,
  Title,
} from '@mantine/core';
import { baseTheme, themeClasses } from '@paraspell/ui';

import classes from './components.module.css';

export const theme = mergeThemeOverrides(
  baseTheme,
  createTheme({
    defaultRadius: 'md-lg',
    headings: {
      sizes: {
        h1: { fontSize: rem(38), lineHeight: '1.08' },
      },
    },
    components: {
      ActionIcon: ActionIcon.extend({
        classNames: { root: `${themeClasses.control} ${classes.control}` },
      }),
      Badge: Badge.extend({
        classNames: { root: `${themeClasses.badge} ${classes.badge}` },
      }),
      Button: Button.extend({
        classNames: { root: `${themeClasses.control} ${classes.control}` },
      }),
      Text: Text.extend({
        classNames: { root: `${themeClasses.text} ${classes.text}` },
      }),
      Title: Title.extend({
        classNames: { root: `${themeClasses.title} ${classes.title}` },
      }),
    },
  }),
);
