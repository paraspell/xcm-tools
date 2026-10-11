import type { MantineColorsTuple } from "@mantine/core";
import {
  ActionIcon,
  alpha,
  Anchor,
  Button,
  createTheme,
  Paper,
  rem,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";

import classes from "./components.module.css";

declare module "@mantine/core" {
  export interface MantineThemeOther {
    darkAccent: string;
  }
}

const themePalette: MantineColorsTuple = [
  "#ffe9f6",
  "#ffd1e6",
  "#faa1c9",
  "#f66eab",
  "#f24391",
  "#f02881",
  "#f01879",
  "#d60867",
  "#c0005c",
  "#a9004f",
];

const darkPalette: MantineColorsTuple = [
  "#f3f1f7",
  "#dcd9e3",
  "#a9a4b5",
  "#9893a5",
  "#3c3745",
  "#322e3a",
  "#1b1920",
  "#121116",
  "#0d0c10",
  "#08070a",
];

const sdkPalette: MantineColorsTuple = [
  "#faf7ff",
  "#f6f0ff",
  "#f4ecff",
  "#e9dffb",
  "#e6dafc",
  "#c9c0dc",
  "#c4aaff",
  "#6e3cbe",
  "#4a4458",
  "#2f2742",
  "#2c2242",
  "#1c1727",
  "#18151f",
];

const apiPalette: MantineColorsTuple = [
  "#fffaf0",
  "#fff8ea",
  "#fff6e4",
  "#fae8c4",
  "#f6e8cb",
  "#ffd696",
  "#dcb874",
  "#aa6e14",
  "#8a6a2c",
  "#3a3020",
  "#342916",
  "#201b12",
  "#1a1711",
];

const anaPalette: MantineColorsTuple = [
  "#f5fcf8",
  "#eefaf3",
  "#eaf9f1",
  "#d3efdf",
  "#ccecdb",
  "#8ce6b9",
  "#74d4a6",
  "#1e8c5f",
  "#2e7a58",
  "#20382c",
  "#163225",
  "#111f19",
  "#111a15",
];

const cliPalette: MantineColorsTuple = [
  "#f5f9ff",
  "#eef5ff",
  "#dfeafa",
  "#d6e5fa",
  "#82a5dc",
  "#2d64be",
  "#22324b",
  "#1b2840",
  "#121a28",
  "#111721",
];

const black = "#141317";

const fontFamily =
  "Figtree, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export const theme = createTheme({
  primaryColor: "mainColor",
  primaryShade: 6,
  colors: {
    mainColor: themePalette,
    dark: darkPalette,
    sdk: sdkPalette,
    api: apiPalette,
    ana: anaPalette,
    cli: cliPalette,
  },
  black,
  spacing: { xxs: rem(4) },
  radius: { "md-lg": rem(12), "lg-xl": rem(24) },
  shadows: {
    hairline: `0 ${rem(1)} ${rem(3)} ${alpha(black, 0.05)}`,
    lift: `0 ${rem(24)} ${rem(40)} ${rem(-24)} ${alpha(themePalette[6], 0.35)}`,
  },
  fontFamily,
  fontFamilyMonospace:
    "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  headings: {
    fontFamily,
    fontWeight: "900",
    sizes: {
      h2: {
        fontSize: `clamp(${rem(32)}, 3.8vw, ${rem(44)})`,
        lineHeight: "1.08",
      },
    },
  },
  defaultRadius: "lg",
  other: { darkAccent: "#ff5fa6" },
  components: {
    ActionIcon: ActionIcon.extend({
      defaultProps: { variant: "default", radius: "md-lg" },
      classNames: { root: classes.control },
    }),
    Anchor: Anchor.extend({ defaultProps: { underline: "never" } }),
    Button: Button.extend({ classNames: { root: classes.control } }),
    Paper: Paper.extend({ defaultProps: { radius: "lg-xl" } }),
    Text: Text.extend({ classNames: { root: classes.text } }),
    ThemeIcon: ThemeIcon.extend({ defaultProps: { radius: "md-lg" } }),
    Title: Title.extend({ classNames: { root: classes.title } }),
  },
});
