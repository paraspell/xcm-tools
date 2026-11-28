import { createTheme, mergeThemeOverrides, rem } from "@mantine/core";
import { baseTheme } from "@paraspell/ui";

export const theme = mergeThemeOverrides(
  baseTheme,
  createTheme({
    defaultRadius: "lg",
    headings: {
      sizes: {
        h2: {
          fontSize: `clamp(${rem(32)}, 3.8vw, ${rem(44)})`,
          lineHeight: "1.08",
        },
      },
    },
  }),
);
